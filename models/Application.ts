import mongoose, { Schema, Document, Model } from 'mongoose';

// Ensure mongoose.models exists (important for Next.js build/runtime)
if (typeof mongoose.models === 'undefined') {
  (mongoose as any).models = {};
}

export interface IApplication extends Document {
  formData: string; // JSON string of form data
  pdfPath?: string; // Path to PDF file in filesystem (instead of buffer to avoid 16MB limit)
  pdfBuffer?: string; // Base64 encoded PDF (deprecated - use pdfPath instead)
  createdAt: Date;
  updatedAt: Date;
  applicantCount: number;
  bhkType?: string; // 3bhk, 4bhk, etc.
}

const ApplicationSchema: Schema = new Schema(
  {
    formData: {
      type: String,
      required: true,
    },
    pdfPath: {
      type: String,
      required: false,
    },
    pdfBuffer: {
      type: String,
      required: false,
    },
    applicantCount: {
      type: Number,
      required: true,
      default: 1,
    },
    bhkType: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create index for faster queries
ApplicationSchema.index({ createdAt: -1 });

// Safely check for existing model or create new one
let Application: Model<IApplication>;
try {
  // Check if model already exists
  if (mongoose.models && mongoose.models.Application) {
    Application = mongoose.models.Application as Model<IApplication>;
  } else {
    // Create new model
    Application = mongoose.model<IApplication>('Application', ApplicationSchema);
  }
} catch (error) {
  // Fallback: always create new model if check fails
  Application = mongoose.model<IApplication>('Application', ApplicationSchema);
}

export default Application;