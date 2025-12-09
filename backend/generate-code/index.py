import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Генерирует код на основе описания пользователя с помощью OpenAI GPT-4
    Args: event - dict с httpMethod, body (prompt, language)
          context - object с request_id, function_name
    Returns: HTTP response с сгенерированным кодом
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        import openai
    except ImportError:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OpenAI library not installed'}),
            'isBase64Encoded': False
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'OpenAI API key not configured'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    prompt: str = body_data.get('prompt', '')
    language: str = body_data.get('language', 'javascript')
    
    if not prompt:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Prompt is required'}),
            'isBase64Encoded': False
        }
    
    client = openai.OpenAI(api_key=api_key)
    
    language_prompts = {
        'javascript': 'JavaScript (ES6+)',
        'python': 'Python 3',
        'java': 'Java',
        'cpp': 'C++',
        'go': 'Go',
        'typescript': 'TypeScript',
        'rust': 'Rust',
        'php': 'PHP'
    }
    
    lang_name = language_prompts.get(language, 'JavaScript')
    
    system_prompt = f"""Ты опытный программист. Генерируй качественный, чистый и хорошо документированный код на языке {lang_name}.
Следуй лучшим практикам языка. Добавляй комментарии для сложных участков.
Формат ответа: только код без дополнительных объяснений."""
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=2000
    )
    
    generated_code = response.choices[0].message.content
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'code': generated_code,
            'language': language,
            'model': 'gpt-4'
        }),
        'isBase64Encoded': False
    }
