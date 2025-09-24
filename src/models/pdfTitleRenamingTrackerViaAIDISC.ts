import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        originalPdfName: { type: String, required: true },
        title: { type: String, required: false },
        author: { type: String, required: false },
        publisher: { type: String, required: false },
        year: { type: String, required: false },
        era: { type: String, required: false },
        editor: { type: String, required: false },
        commentator: { type: String, required: false },
        translator: { type: String, required: false },
        language: { type: String, required: false },
        otherLanguage: { type: String, required: false },
        dateOfExecution: { type: Date, required: true, default: Date.now }
    }, {
        collection: 'PDF_TITLE_RENAMING_TRACKER_VIA_AI',
        timestamps:true
    }
);

export const PdfTitleRenamingTrackerViaAIDisc = mongoose.model('PDF_TITLE_RENAMING_TRACKER_VIA_AI', schema);


