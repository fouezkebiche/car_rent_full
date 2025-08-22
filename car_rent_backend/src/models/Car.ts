import { Schema, Document, Types, model } from 'mongoose';

export interface ICar extends Document {
  brand: string;
  carModel: string;
  year: number;
  price: number;
  image: string;
  category: 'Economy' | 'Compact' | 'SUV' | 'Luxury' | 'Sports';
  transmission: 'Manual' | 'Automatic';
  fuel: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  seats: number;
  available: boolean;
  features: string[];
  wilaya: string;  // New: Selected wilaya name
  commune: string; // New: Selected commune name
  rating: number;
  ownerId: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  chauffeur: boolean;
}

const CarSchema: Schema<ICar> = new Schema({
  brand: { type: String, required: true },
  carModel: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, enum: ['Economy', 'Compact', 'SUV', 'Luxury', 'Sports'], required: true },
  transmission: { type: String, enum: ['Manual', 'Automatic'], required: true },
  fuel: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'], required: true },
  seats: { type: Number, required: true },
  available: { type: Boolean, default: true },
  features: [{ type: String }],
  wilaya: { type: String, required: true },  // New
  commune: { type: String, required: true }, // New
  rating: { type: Number, default: 0 },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  chauffeur: { type: Boolean, default: false },
});

export default model<ICar>('Car', CarSchema);