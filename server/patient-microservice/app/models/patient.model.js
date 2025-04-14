import mongoose from 'mongoose';

const { Schema } = mongoose;

// Emergency Alert Schema
const EmergencyAlertSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['NEW', 'ACKNOWLEDGED', 'RESOLVED'],
        default: 'NEW'
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
    },
    notes: {
        type: String,
        default: ''
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
    severity: {
        type: String,
        enum: ['MILD', 'MODERATE', 'SEVERE'],
        default: 'MODERATE'
    },
    notes: {
        type: String,
        default: ''
    }
});

// Appointment Schema
const AppointmentSchema = new Schema({
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'REQUESTED'
    },
    reason: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    nurseId: {
        type: String
    }
});

// Patient Data Schema - stores only patient-specific data
// Assumes user identity and role are managed by auth service
const PatientDataSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    emergencyContacts: [{
        name: String,
        relationship: String,
        phone: String
    }],
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
    medicalConditions: [{
        name: String,
        diagnosedDate: Date,
        notes: String
    }],
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date
    }],
    preferredNurses: [{
        type: String // References userId of nurses
    }],
    dailyRecords: [DailyRecordSchema],
    symptoms: [SymptomSchema],
    appointments: [AppointmentSchema],
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
PatientDataSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('PatientData', PatientDataSchema); 