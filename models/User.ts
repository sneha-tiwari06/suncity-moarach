import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Ensure mongoose.models exists (important for Next.js build/runtime)
if (typeof mongoose.models === 'undefined') {
  (mongoose as any).models = {};
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Note: unique: true on fields automatically creates indexes
// No need for explicit index() calls to avoid duplicate index warnings

// Safely check for existing model or create new one
let User: Model<IUser>;
try {
  // Check if model already exists
  if (mongoose.models && mongoose.models.User) {
    User = mongoose.models.User as Model<IUser>;
  } else {
    // Create new model
    User = mongoose.model<IUser>('User', UserSchema);
  }
} catch (error) {
  // Fallback: always create new model if check fails
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;
