import mongoose from 'mongoose';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: "Username is required",
    },
    email: {
        type: String,
        trim: true,
        required: "Email is required",
        unique: "Email already exists",
        match: [/.+\@.+\..+/, "Please fill a valid email address"],
    },
    hashed_password: {
        type: String,
        required: "Password is required",
    },
    salt: {
        type: String,
    },
    role: {
        type: String,
        required: true,
        enum: ['resident', 'business_owner', 'community_organizer']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

UserSchema.virtual('password')
    .set(function (password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });

UserSchema.path("hashed_password").validate(function (v) {
    if (this.isNew && !this._password) {
        this.invalidate("password", "Password is required");
    }
    if (this._password && this._password.length < 6) {
        this.invalidate("password", "Password must be at least 6 characters.");
    }
}, null);

UserSchema.methods = {
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },

    encryptPassword: function (password) {
        if (!password) return "";
        try {
            return crypto
                .createHmac("sha1", this.salt)
                .update(password)
                .digest("hex");
        } catch (err) {
            return "";
        }
    },

    makeSalt: function () {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    }
}


const User = mongoose.model("User", UserSchema);

export default User;
