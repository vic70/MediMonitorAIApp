import mongoose from 'mongoose';
const { Schema } = mongoose;

// Daily Motivational Tip Schema
const MotivationalTipSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    // patient references the User model, meaning each patient is represented as a user
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Nurse Schema - Stores nurse-specific data with daily motivational tips
const NurseSchema = new Schema({
    // user references the User model so that the nurse is tied to a user record
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    motivationalTips: [MotivationalTipSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update updatedAt field on every save
NurseSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Nurse', NurseSchema);
