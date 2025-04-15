import mongoose from 'mongoose';

const Schema = mongoose.Schema;

// Sub-schema for Emergency Alerts
const EmergencyAlertSchema = new Schema({
    create_date: {
        type: Date,
        default: Date.now
    },
    content: {
        type: String,
        required: true
    }
});

// Sub-schema for Daily Info Required (indicating what daily information should be recorded)
const DailyInfoRequiredSchema = new Schema({
    pulseRate: { type: Boolean, default: true },
    bloodPressure: { type: Boolean, default: true },
    weight: { type: Boolean, default: true },
    temperature: { type: Boolean, default: true },
    respiratoryRate: { type: Boolean, default: true }
}, { _id: false });  // _id disabled to avoid creating an extra id field

// Sub-schema for the Symptoms checklist
const SymptomsSchema = new Schema({
    breathingProblem: { type: Boolean, default: false },
    fever: { type: Boolean, default: false },
    dryCough: { type: Boolean, default: false },
    soreThroat: { type: Boolean, default: false },
    runningNose: { type: Boolean, default: false },
    asthma: { type: Boolean, default: false },
    chronicLungDisease: { type: Boolean, default: false },
    headache: { type: Boolean, default: false },
    heartDisease: { type: Boolean, default: false },
    diabetes: { type: Boolean, default: false },
    hyperTension: { type: Boolean, default: false },
    fatigue: { type: Boolean, default: false },
    gastrointestinal: { type: Boolean, default: false },
    abroadTravel: { type: Boolean, default: false },
    contactWithCovidPatient: { type: Boolean, default: false },
    attendedLargeGathering: { type: Boolean, default: false },
    visitedPublicExposedPlaces: { type: Boolean, default: false },
    familyWorkingInPublicExposedPlaces: { type: Boolean, default: false },
    wearingMasks: { type: Boolean, default: false },
    sanitizationFromMarket: { type: Boolean, default: false }
}, { _id: false });

// Sub-schema for Daily Records, including health measurements and symptoms checklist
const DailyRecordSchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    pulseRate: { type: Number },
    bloodPressure: { type: Number },
    weight: { type: Number },
    temperature: { type: Number },
    respiratoryRate: { type: Number },
});

// Main Patient Schema connecting the User to their patient data
const PatientSchema = new Schema({
    // Link to the User model (assumed managed in a separate auth service)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    emergencyAlerts: [EmergencyAlertSchema],
    dailyInfoRequired: {
        type: DailyInfoRequiredSchema,
        default: {}   // Mongoose will then apply default values for each field defined in DailyInfoRequiredSchema
    },
    dailyRecords: [DailyRecordSchema],
    symptoms: {
        type: SymptomsSchema,
        default: {}   // Mongoose will apply defaults for each field in SymptomsSchema
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

// Middleware to update the 'updatedAt' field on every save
PatientSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('PatientData', PatientSchema); 