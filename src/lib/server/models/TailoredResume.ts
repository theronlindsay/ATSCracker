import mongoose from 'mongoose';

const TailoredResumeSchema = new mongoose.Schema(
	{
		jobDescription: {
			type: String,
			required: true
		},
		companyName: {
			type: String,
			default: ''
		},
		theme: {
			type: String,
			default: 'macchiato'
		},
		data: {
			type: mongoose.Schema.Types.Mixed,
			required: true
		}
	},
	{ timestamps: true }
);

export const TailoredResume =
	mongoose.models.TailoredResume || mongoose.model('TailoredResume', TailoredResumeSchema);
