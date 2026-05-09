type IntroEmailRecord = {
  intent: string
  targetMarket: string
}

export function buildIntroEmail(record: IntroEmailRecord) {
  return {
    subject: `Harbourview Introduction: ${record.intent} opportunity`,
    body: `This is a controlled introduction facilitated by Harbourview.\n\nA qualified party has requested access for ${record.targetMarket}.\n\nNext steps should be coordinated through Harbourview.`
  }
}
