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
    category: {
        type: String,
        default: 'General'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        id: String,
        firstName: String,
        lastName: String,
        role: String
    }
});

// Nurse Data Schema - stores only nurse-specific data
// Assumes user identity and role are managed by auth service
const NurseDataSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    motivationalTips: [MotivationalTipSchema],
    assignedPatients: [{
        type: String,
        ref: 'User'  // References userId in the User model from auth service
    }],
    specialization: {
        type: String,
        default: 'General'
    },
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
NurseDataSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('NurseData', NurseDataSchema); 