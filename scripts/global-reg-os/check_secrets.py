#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import re
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2] / 'docs/control/global-regulatory-os'
MAX_MEMBER_BYTES = 64 * 1024 * 1024
MAX_ARCHIVE_BYTES = 256 * 1024 * 1024
MAX_COMPRESSION_RATIO = 200

patterns = {
    'private_key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'github_token': re.compile(r'gh[pousr]_[A-Za-z0-9_]{20,}'),
    'openai_key': re.compile(r'sk-(?:proj-)?[A-Za-z0-9_-]{20,}'),
    'supabase_service_key': re.compile(r'eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'),
}

errors: list[str] = []
evidence: list[str] = []


def scan_bytes(label: str, data: bytes) -> None:
    digest = hashlib.sha256(data).hexdigest()
    evidence.append(f'{label}\tbytes={len(data)}\tsha256={digest}')
    text = data.decode('utf-8', errors='ignore')
    for name, pattern in patterns.items():
        if pattern.search(text):
            errors.append(f'{name}: {label}')


def safe_member_name(name: str) -> PurePosixPath:
    if '\x00' in name:
        raise ValueError('NUL byte in member name')
    if '\\' in name:
        raise ValueError('backslash path separator is forbidden')
    path = PurePosixPath(name)
    if path.is_absolute() or any(part in ('', '.', '..') for part in path.parts):
        raise ValueError('unsafe or non-canonical member path')
    return path


def scan_zip(path: Path) -> None:
    archive_label = path.relative_to(ROOT).as_posix()
    seen: set[str] = set()
    total_uncompressed = 0
    try:
        with zipfile.ZipFile(path) as archive:
            for info in sorted(archive.infolist(), key=lambda item: item.filename):
                try:
                    member_path = safe_member_name(info.filename)
                except ValueError as exc:
                    errors.append(f'unsafe_zip_member: {archive_label}!{info.filename}: {exc}')
                    continue

                canonical_name = member_path.as_posix()
                if canonical_name in seen:
                    errors.append(f'duplicate_zip_member: {archive_label}!{canonical_name}')
                    continue
                seen.add(canonical_name)

                unix_mode = (info.external_attr >> 16) & 0xFFFF
                if unix_mode and not (stat.S_ISREG(unix_mode) or stat.S_ISDIR(unix_mode)):
                    errors.append(f'unsafe_zip_member_type: {archive_label}!{canonical_name}')
                    continue
                if info.flag_bits & 0x1:
                    errors.append(f'encrypted_zip_member: {archive_label}!{canonical_name}')
                    continue
                if info.is_dir():
                    continue
                if info.file_size > MAX_MEMBER_BYTES:
                    errors.append(f'oversized_zip_member: {archive_label}!{canonical_name}: {info.file_size}')
                    continue

                total_uncompressed += info.file_size
                if total_uncompressed > MAX_ARCHIVE_BYTES:
                    errors.append(f'oversized_zip_archive: {archive_label}: {total_uncompressed}')
                    break

                compressed = max(info.compress_size, 1)
                if info.file_size > 1024 * 1024 and info.file_size / compressed > MAX_COMPRESSION_RATIO:
                    errors.append(
                        f'excessive_zip_compression_ratio: {archive_label}!{canonical_name}: '
                        f'{info.file_size / compressed:.1f}'
                    )
                    continue

                try:
                    data = archive.read(info)
                except (RuntimeError, zipfile.BadZipFile, OSError) as exc:
                    errors.append(f'unreadable_zip_member: {archive_label}!{canonical_name}: {exc}')
                    continue
                if len(data) != info.file_size:
                    errors.append(
                        f'zip_member_size_mismatch: {archive_label}!{canonical_name}: '
                        f'expected={info.file_size} actual={len(data)}'
                    )
                    continue
                scan_bytes(f'zip:{archive_label}!{canonical_name}', data)
    except (zipfile.BadZipFile, OSError) as exc:
        errors.append(f'invalid_zip_archive: {archive_label}: {exc}')


for path in sorted(ROOT.rglob('*'), key=lambda item: item.relative_to(ROOT).as_posix()):
    if not path.is_file():
        continue
    if path.suffix.lower() == '.zip':
        scan_zip(path)
        continue
    try:
        data = path.read_bytes()
    except OSError as exc:
        errors.append(f'unreadable_file: {path.relative_to(ROOT).as_posix()}: {exc}')
        continue
    scan_bytes(f'file:{path.relative_to(ROOT).as_posix()}', data)

for line in sorted(evidence):
    print(f'SCANNED\t{line}')
manifest_material = ('\n'.join(sorted(evidence)) + '\n').encode('utf-8')
print(f'SCAN_EVIDENCE_SHA256\t{hashlib.sha256(manifest_material).hexdigest()}\titems={len(evidence)}')

if errors:
    print('\n'.join(sorted(errors)), file=sys.stderr)
    sys.exit(1)
print('PASS: no secret-like values in Global Regulatory OS package, including ZIP members')
