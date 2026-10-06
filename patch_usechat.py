import sys
with open('frontend/src/hooks/useChat.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "lastEvent?.type === 'chat_message'",
    "(lastEvent?.type === 'chat_message' || lastEvent?.type === 'chat_message_created')"
)

with open('frontend/src/hooks/useChat.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
