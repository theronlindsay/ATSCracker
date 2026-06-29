import mongoose from 'mongoose';

const MasterDataSchema = new mongoose.Schema(
	{
		section: {
			type: String,
			required: true,
			unique: true // 'basics', 'work', 'education', 'skills', etc.
		},
		data: {
			type: mongoose.Schema.Types.Mixed,
			required: true,
			default: {}
		}
	},
	{ timestamps: true }
);

export const MasterData =
	mongoose.models.MasterData || mongoose.model('MasterData', MasterDataSchema);
