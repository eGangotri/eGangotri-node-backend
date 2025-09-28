# AI Renamer Test

## 1.List Models/Endpoints Available to you
 ### Do a GET Request to the following URL:

https://generativelanguage.googleapis.com/v1/models?key=XXXXXX

Response as JSON:

{
	"models": [
		{
			"name": "models/gemini-2.5-flash",
			"version": "001",
			"displayName": "Gemini 2.5 Flash",
			"description": "Stable version of Gemini 2.5 Flash, our mid-size multimodal model that supports up to 1 million tokens, released in June of 2025.",
			"inputTokenLimit": 1048576,
			"outputTokenLimit": 65536,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"createCachedContent",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 64,
			"maxTemperature": 2,
			"thinking": true
		},
		{
			"name": "models/gemini-2.5-pro",
			"version": "2.5",
			"displayName": "Gemini 2.5 Pro",
			"description": "Stable release (June 17th, 2025) of Gemini 2.5 Pro",
			"inputTokenLimit": 1048576,
			"outputTokenLimit": 65536,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"createCachedContent",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 64,
			"maxTemperature": 2,
			"thinking": true
		},
		{
			"name": "models/gemini-2.0-flash",
			"version": "2.0",
			"displayName": "Gemini 2.0 Flash",
			"description": "Gemini 2.0 Flash",
			"inputTokenLimit": 1048576,
			"outputTokenLimit": 8192,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"createCachedContent",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 40,
			"maxTemperature": 2
		},
		{
			"name": "models/gemini-2.0-flash-001",
			"version": "2.0",
			"displayName": "Gemini 2.0 Flash 001",
			"description": "Stable version of Gemini 2.0 Flash, our fast and versatile multimodal model for scaling across diverse tasks, released in January of 2025.",
			"inputTokenLimit": 1048576,
			"outputTokenLimit": 8192,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"createCachedContent",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 40,
			"maxTemperature": 2
		},
		{
			"name": "models/gemini-2.0-flash-lite-001",
			"version": "2.0",
			"displayName": "Gemini 2.0 Flash-Lite 001",
			"description": "Stable version of Gemini 2.0 Flash-Lite",
			"inputTokenLimit": 1048576,
			"outputTokenLimit": 8192,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"createCachedContent",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 40,
			"maxTemperature": 2
		},
		{
			"name": "models/gemini-2.0-flash-lite",
			"version": "2.0",
			"displayName": "Gemini 2.0 Flash-Lite",
			"description": "Gemini 2.0 Flash-Lite",
			"inputTokenLimit": 1048576,
			"outputTokenLimit": 8192,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"createCachedContent",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 40,
			"maxTemperature": 2
		},
		{
			"name": "models/gemini-2.0-flash-preview-image-generation",
			"version": "2.0",
			"displayName": "Gemini 2.0 Flash Preview Image Generation",
			"description": "Gemini 2.0 Flash Preview Image Generation",
			"inputTokenLimit": 32768,
			"outputTokenLimit": 8192,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 64,
			"maxTemperature": 2
		},
		{
			"name": "models/gemini-2.5-flash-lite",
			"version": "001",
			"displayName": "Gemini 2.5 Flash-Lite",
			"description": "Stable version of Gemini 2.5 Flash-Lite, released in July of 2025",
			"inputTokenLimit": 1048576,
			"outputTokenLimit": 65536,
			"supportedGenerationMethods": [
				"generateContent",
				"countTokens",
				"createCachedContent",
				"batchGenerateContent"
			],
			"temperature": 1,
			"topP": 0.95,
			"topK": 64,
			"maxTemperature": 2,
			"thinking": true
		},
		{
			"name": "models/embedding-001",
			"version": "001",
			"displayName": "Embedding 001",
			"description": "Obtain a distributed representation of a text.",
			"inputTokenLimit": 2048,
			"outputTokenLimit": 1,
			"supportedGenerationMethods": [
				"embedContent"
			]
		},
		{
			"name": "models/text-embedding-004",
			"version": "004",
			"displayName": "Text Embedding 004",
			"description": "Obtain a distributed representation of a text.",
			"inputTokenLimit": 2048,
			"outputTokenLimit": 1,
			"supportedGenerationMethods": [
				"embedContent"
			]
		}
	]
}


## 2. Check a Specific Model
 ### Do a POST  Request to the following URL:

https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=XXXXX

where your specific model "v1/models/gemini-2.5-flash" in encoded above.

JSON Body:
{
  "contents": [
    {
      "parts": [
        { "text": "Capital of UP" }
      ]
    }
  ]
}

JSON Response:

{
	"candidates": [
		{
			"content": {
				"parts": [
					{
						"text": "The capital of Uttar Pradesh (UP) is **Lucknow**."
					}
				],
				"role": "model"
			},
			"finishReason": "STOP",
			"index": 0
		}
	],
	"usageMetadata": {
		"promptTokenCount": 3,
		"candidatesTokenCount": 13,
		"totalTokenCount": 92,
		"promptTokensDetails": [
			{
				"modality": "TEXT",
				"tokenCount": 3
			}
		],
		"thoughtsTokenCount": 76
	},
	"modelVersion": "gemini-2.5-flash",
	"responseId": "unvYaMmxM7XY2roPlMqRsQ4"
}

