import mongoose from 'mongoose';

const { Schema } = mongoose;

// Daily Motivational Tip Schema
const MotivationalTipSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Nurse Schema
const NurseSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    motivationalTips: [MotivationalTipSchema],
    patients: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the 'updatedAt' field on save
NurseSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Nurse', NurseSchema); 