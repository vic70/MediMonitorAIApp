import mongoose from 'mongoose';

const { Schema } = mongoose;

// Emergency Alert Schema
const EmergencyAlertSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Daily Record Schema
const DailyRecordSchema = new Schema({
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    pulseRate: {
        type: Number,
        default: null
    },
    bloodPressure: {
        type: String,
        default: null
    },
    weight: {
        type: Number,
        default: null
    },
    temperature: {
        type: Number,
        default: null
    },
    respiratoryRate: {
        type: Number,
        default: null
    }
});

// Symptom Schema
const SymptomSchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    symptoms: [{
        type: String
    }],
    notes: {
        type: String,
        default: ''
    }
});

// Patient Schema
const PatientSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    emergencyAlerts: [EmergencyAlertSchema],
    dailyInfoRequired: {
        pulseRate: {
            type: Boolean,
            default: false
        },
        bloodPressure: {
            type: Boolean,
            default: false
        },
        weight: {
            type: Boolean,
            default: false
        },
        temperature: {
            type: Boolean,
            default: false
        },
        respiratoryRate: {
            type: Boolean,
            default: false
        }
    },
    dailyRecords: [DailyRecordSchema],
    symptoms: [SymptomSchema],
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
PatientSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Patient', PatientSchema); 