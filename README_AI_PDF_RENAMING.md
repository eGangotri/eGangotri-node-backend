# Google AI PDF Renaming Tool

This tool allows you to automatically rename PDF files based on their content using Google AI's Gemini models.

## Setup Instructions

1. **Get a Google AI API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create an API key
   - Make sure your API key has access to the Gemini API

2. **Configure your environment**:
   - Create a `.env` file in the root directory if it doesn't exist
   - Add your Google AI API key to the `.env` file:
     ```
     GOOGLE_AI_API_KEY=your_google_ai_api_key_here
     ```
   - Optionally, you can specify a custom endpoint (usually not needed):
     ```
     # Default endpoint is used if this is not specified
     # AI_ENDPOINT=https://custom-endpoint-if-needed.com
     ```

3. **Install dependencies**:
   ```
   npm install axios
   ```
   or
   ```
   pnpm install axios
   ```

## Usage

Run the tool with:

```
pnpm run rename-pdfs-via-ai [input_folder_paths...]
```

If no input folder paths are provided, it will use the default: `F:\playground\_tulsi\Rack 58-TST+`

### Configuration Options

You can modify these options in the `renamePdfsViaAI.ts` file:

- `inputFolders`: Array of folder paths containing PDFs to process
- `outputFolder`: Set to a path to copy renamed files to a new location
- `batchSize`: Number of PDFs to process in parallel (default: 5)
- `dryRun`: Set to true to see what would be renamed without actually renaming
- `renameInPlace`: Set to false to copy files to outputFolder instead of renaming in place

## How It Works

The tool:

1. Finds all PDF files in the specified directories
2. Converts each PDF to a base64-encoded string
3. Sends the encoded PDF directly to Google's Gemini API
4. Uses a specially crafted prompt to extract metadata (title, author, language, year, publisher)
5. Formats the response and renames the PDF file accordingly
6. Processes files in batches to manage API usage

## Notes

- This tool requires an internet connection and a valid Google AI API key
- Google's Gemini API has size limits for PDFs (typically around 20MB)
- The first run may be in "dry run" mode to preview changes before actual renaming
- If API calls fail (authentication issues, rate limits, etc.), the tool will fall back to using the existing filename
- Detailed error messages will help diagnose issues with API connectivity or authentication
- For large PDFs, the tool may need to be modified to process only the first few pages
