CREATE POLICY "anon full access" ON job_search.companies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.jobs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.applications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.resume_versions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.contacts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.outreach_messages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon full access" ON job_search.settings FOR ALL TO anon USING (true) WITH CHECK (true);