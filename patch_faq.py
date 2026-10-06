import re

with open('frontend/src/utils/faqBot.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''
export const SUGGESTED_PROMPTS = {
  patient: [
    'How long is my wait?',
    "What medications do I have?",
    'Who is being seen now?',
    'What is my token number?'
  ],
  staff: [
    'How many patients are waiting?',
    'Who is next in queue?',
    'Show today patient flow',
    'Any medicine expiry risks?',
    'What is the doctor workload?',
    'Show active ML models'
  ]
};
'''
content = re.sub(r'export const SUGGESTED_PROMPTS = \{[\s\S]*?\};', replacement.strip(), content)
with open('frontend/src/utils/faqBot.js', 'w', encoding='utf-8') as f:
    f.write(content)
