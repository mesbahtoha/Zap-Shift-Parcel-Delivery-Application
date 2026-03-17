// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
// import Stripe from "stripe";
// import admin from "firebase-admin";
// // import serviceAccount from "./firebase-admin-key.json" with { type: "json" };
// import nodemailer from "nodemailer";
// import serverless from "serverless-http"; 

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;
// const TAKA_PER_USD = 120;
// const serverless = require('serverless-http');
// export const handler = serverless(app);

// /* -------------------------------------------------------------------------- */
// /*                                  Middleware                                */
// /* -------------------------------------------------------------------------- */

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:3000",
// ];

// app.use(
//   cors({
//     origin(origin, callback) {
//       if (!origin) return callback(null, true);

//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }

//       return callback(new Error(`CORS blocked for origin: ${origin}`));
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use(express.json());

// /* -------------------------------------------------------------------------- */
// /*                             Firebase Admin Init                            */
// /* -------------------------------------------------------------------------- */
// const decodedKey = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
// const serviceAccount = JSON.parse(decodedKey);

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// /* -------------------------------------------------------------------------- */
// /*                                Mail Sender                                 */
// /* -------------------------------------------------------------------------- */

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_SENDER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// /* -------------------------------------------------------------------------- */
// /*                                   Stripe                                   */
// /* -------------------------------------------------------------------------- */

// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error("Missing STRIPE_SECRET_KEY");
// }

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// /* -------------------------------------------------------------------------- */
// /*                                   Helpers                                  */
// /* -------------------------------------------------------------------------- */

// const now = () => new Date();

// const toObjectId = (id) => new ObjectId(id);
// const isValidObjectId = (id) => ObjectId.isValid(id);

// const normalizeStatus = (value = "") => String(value).trim().toLowerCase();

// const convertTakaToUsdCents = (taka) => {
//   const numericTaka = Number(taka);
//   return Math.round((numericTaka / TAKA_PER_USD) * 100);
// };

// const generateTrackingId = () =>
//   `TRK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

// const serializeDoc = (doc) => {
//   if (!doc) return doc;

//   return {
//     ...doc,
//     _id: doc._id?.toString?.() || doc._id,
//   };
// };

// const sendServerError = (res, message, error) => {
//   console.error(message, error);
//   res.status(500).send({
//     message,
//     ...(error?.message ? { error: error.message } : {}),
//   });
// };

// const validateEmail = (email, res) => {
//   if (!email) {
//     res.status(400).send({ message: "Email is required" });
//     return false;
//   }
//   return true;
// };

// const validateObjectId = (id, label, res) => {
//   if (!isValidObjectId(id)) {
//     res.status(400).send({ message: `Invalid ${label}` });
//     return false;
//   }
//   return true;
// };

// /* -------------------------------------------------------------------------- */
// /*                              MongoDB Connection                            */
// /* -------------------------------------------------------------------------- */

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mesbahul01.jvrqgnw.mongodb.net/?retryWrites=true&w=majority&appName=Mesbahul01`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// let dbReadyPromise;

// let usersCollection;
// let riderAccountsCollection;
// let parcelsCollection;
// let paymentsCollection;
// let otpCollection;
// let riderTasksCollection;
// let riderEarningsCollection;
// let notificationsCollection;

// async function connectDB() {
//   if (dbReadyPromise) return dbReadyPromise;

//   dbReadyPromise = (async () => {
//     await client.connect();
//     await client.db("admin").command({ ping: 1 });

//     const db = client.db("parcelDB");

//     parcelsCollection = db.collection("parcels");
//     paymentsCollection = db.collection("payments");
//     usersCollection = db.collection("users");
//     otpCollection = db.collection("otp_verifications");
//     riderAccountsCollection = db.collection("riderAccounts");
//     riderTasksCollection = db.collection("riderTasks");
//     riderEarningsCollection = db.collection("riderEarnings");
//     notificationsCollection = db.collection("notifications");

//     await usersCollection.createIndex({ email: 1 }, { unique: true });
//     await riderAccountsCollection.createIndex({ email: 1 }, { unique: true });
//     await parcelsCollection.createIndex(
//       { trackingId: 1 },
//       { unique: true, sparse: true }
//     );
//     await paymentsCollection.createIndex(
//       { transactionId: 1 },
//       { unique: true, sparse: true }
//     );
//     await notificationsCollection.createIndex({
//       recipientRole: 1,
//       recipientEmail: 1,
//       createdAt: -1,
//     });

//     console.log("MongoDB connected");
//   })();

//   return dbReadyPromise;
// }

// app.use(async (req, res, next) => {
//   try {
//     await connectDB();
//     next();
//   } catch (error) {
//     sendServerError(res, "Database connection failed", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                               Auth Middleware                              */
// /* -------------------------------------------------------------------------- */

// const verifyFBToken = async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }

//   const token = authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }

//   try {
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.decoded = decoded;
//     next();
//   } catch (error) {
//     return res.status(403).send({ message: "forbidden access" });
//   }
// };

// const verifyAdmin = async (req, res, next) => {
//   try {
//     const email = req.decoded?.email;

//     if (!email) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }

//     const user = await usersCollection.findOne({ email });

//     if (!user) {
//       return res.status(403).send({ message: "admin user not found" });
//     }

//     if (user.role !== "admin") {
//       return res.status(403).send({ message: "admin only access" });
//     }

//     req.adminUser = user;
//     next();
//   } catch (error) {
//     sendServerError(res, "Failed to verify admin", error);
//   }
// };

// const verifyRiderOrAdmin = async (req, res, next) => {
//   try {
//     const email = req.decoded?.email;

//     if (!email) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }

//     const user = await usersCollection.findOne({ email });
//     const rider = await riderAccountsCollection.findOne({ email });

//     const isAdmin = user?.role === "admin";
//     const isRider = !!rider;

//     if (!isAdmin && !isRider) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     req.isAdmin = isAdmin;
//     req.isRider = isRider;
//     req.currentRider = rider || null;

//     next();
//   } catch (error) {
//     sendServerError(res, "Failed to verify access", error);
//   }
// };

// /* -------------------------------------------------------------------------- */
// /*                         Notification Helper                                */
// /* -------------------------------------------------------------------------- */

// const createNotification = async ({
//   type,
//   title,
//   message,
//   recipientRole = "admin",
//   recipientEmail = null,
//   relatedId = null,
//   relatedCollection = null,
//   meta = {},
// }) => {
//   if (!notificationsCollection) return;

//   await notificationsCollection.insertOne({
//     type,
//     title,
//     message,
//     recipientRole,
//     recipientEmail,
//     relatedId,
//     relatedCollection,
//     meta,
//     isRead: false,
//     createdAt: now(),
//   });
// };

// /* -------------------------------------------------------------------------- */
// /*                                    Root                                    */
// /* -------------------------------------------------------------------------- */

// app.get("/", (req, res) => {
//   res.send("Parcel server is running!");
// });

// /* -------------------------------------------------------------------------- */
// /*                                 User Routes                                */
// /* -------------------------------------------------------------------------- */

// app.post("/users", async (req, res) => {
//   try {
//     const { email, picture } = req.body;

//     if (!validateEmail(email, res)) return;

//     const existingUser = await usersCollection.findOne({ email });

//     if (existingUser) {
//       const updateDoc = {
//         $set: {
//           last_login: now(),
//           ...(picture ? { picture } : {}),
//         },
//       };

//       const updateResult = await usersCollection.updateOne({ email }, updateDoc);

//       return res.status(200).send({
//         message: "User already exists",
//         inserted: false,
//         updateResult,
//       });
//     }

//     const userDoc = {
//       ...req.body,
//       role: req.body.role || "user",
//       picture: picture || "",
//       created_at: now(),
//       last_login: now(),
//       updated_at: now(),
//     };

//     const result = await usersCollection.insertOne(userDoc);
//     res.send(result);
//   } catch (error) {
//     sendServerError(res, "Failed to save user", error);
//   }
// });

// app.patch("/users/last-login", verifyFBToken, async (req, res) => {
//   try {
//     const { email, picture } = req.body;

//     if (!validateEmail(email, res)) return;

//     if (req.decoded.email !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const updateDoc = {
//       $set: {
//         last_login: now(),
//         ...(picture ? { picture } : {}),
//       },
//     };

//     const result = await usersCollection.updateOne({ email }, updateDoc);

//     if (result.matchedCount === 0) {
//       return res.status(404).send({ message: "User not found" });
//     }

//     res.send(result);
//   } catch (error) {
//     sendServerError(res, "Failed to update last login", error);
//   }
// });

// app.patch("/users/profile", verifyFBToken, async (req, res) => {
//   try {
//     const { email, name, picture } = req.body;

//     if (!validateEmail(email, res)) return;

//     if (req.decoded.email !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const result = await usersCollection.updateOne(
//       { email },
//       {
//         $set: {
//           name: name || "",
//           picture: picture || "",
//           updated_at: now(),
//         },
//       }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).send({ message: "User not found" });
//     }

//     res.send({
//       message: "Profile updated successfully",
//       result,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to update profile", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                                  OTP Routes                                */
// /* -------------------------------------------------------------------------- */

// app.post("/auth/send-otp", async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res
//         .status(400)
//         .send({ success: false, message: "Email is required" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     await otpCollection.deleteMany({ email });

//     await otpCollection.insertOne({
//       email,
//       otp,
//       createdAt: now(),
//       expiresAt: new Date(Date.now() + 5 * 60 * 1000),
//       verified: false,
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_SENDER,
//       to: email,
//       subject: "Your OTP Code",
//       html: `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 5 minutes.</p>`,
//     });

//     res.send({
//       success: true,
//       message: "OTP sent successfully",
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to send OTP", error);
//   }
// });

// app.post("/auth/verify-otp", async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).send({
//         success: false,
//         message: "Email and OTP are required",
//       });
//     }

//     const otpDoc = await otpCollection.findOne({ email, otp });

//     if (!otpDoc) {
//       return res.status(400).send({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }

//     if (new Date() > new Date(otpDoc.expiresAt)) {
//       return res.status(400).send({
//         success: false,
//         message: "OTP expired",
//       });
//     }

//     await otpCollection.updateOne(
//       { _id: otpDoc._id },
//       {
//         $set: {
//           verified: true,
//         },
//       }
//     );

//     res.send({
//       success: true,
//       message: "OTP verified successfully",
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to verify OTP", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                                  Role Route                                */
// /* -------------------------------------------------------------------------- */

// app.get("/users/role/:email", async (req, res) => {
//   try {
//     const email = req.params.email;

//     if (!validateEmail(email, res)) return;

//     const user = await usersCollection.findOne({ email });

//     if (user) {
//       return res.send({
//         role: user.role || "user",
//         isAdmin: user.role === "admin",
//         isRider: user.role === "rider",
//       });
//     }

//     const rider = await riderAccountsCollection.findOne({ email });

//     if (rider) {
//       return res.send({
//         role: "rider",
//         isAdmin: false,
//         isRider: true,
//       });
//     }

//     res.status(404).send({ message: "Account not found" });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch role", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                             Parcel / Order Routes                          */
// /* -------------------------------------------------------------------------- */

// app.post("/parcels", verifyFBToken, async (req, res) => {
//   try {
//     const parcelData = req.body;

//     if (req.decoded.email !== parcelData.userEmail) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const newParcel = {
//       ...parcelData,
//       trackingId: parcelData.trackingId || generateTrackingId(),
//       paymentStatus: "unpaid",
//       deliveryStatus: parcelData.deliveryStatus || "pending",
//       transactionId: null,
//       paidAt: null,
//       assignedRiderId: null,
//       assignedRiderEmail: null,
//       assignedRiderName: null,
//       cashReceivedByAdmin: false,
//       parcelCurrentStatus: parcelData.deliveryStatus || "pending",
//       createdAt: now(),
//       updatedAt: now(),
//     };

//     const result = await parcelsCollection.insertOne(newParcel);

//     await createNotification({
//       type: "parcel_order",
//       title: "New parcel order",
//       message: `New parcel order placed by ${parcelData.userEmail}`,
//       recipientRole: "admin",
//       relatedId: result.insertedId.toString(),
//       relatedCollection: "parcels",
//       meta: { trackingId: newParcel.trackingId },
//     });

//     res.status(201).json({
//       message: "Parcel saved successfully",
//       insertedId: result.insertedId,
//       trackingId: newParcel.trackingId,
//     });
//   } catch (error) {
//     sendServerError(res, "Error saving parcel", error);
//   }
// });

// app.get("/parcels", async (req, res) => {
//   try {
//     const parcels = await parcelsCollection.find().sort({ createdAt: -1 }).toArray();
//     res.json(parcels.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Error fetching parcels", error);
//   }
// });

// app.get("/parcels/user/:email", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.params.email;

//     if (!validateEmail(email, res)) return;

//     if (req.decoded.email !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const parcels = await parcelsCollection
//       .find({ userEmail: email })
//       .sort({ createdAt: -1 })
//       .toArray();

//     res.json(parcels.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Error fetching parcels", error);
//   }
// });

// app.get("/parcels/:id", verifyFBToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "parcel id", res)) return;

//     const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

//     if (!parcel) {
//       return res.status(404).json({ message: "Parcel not found" });
//     }

//     const isOwner = req.decoded.email === parcel.userEmail;
//     const user = await usersCollection.findOne({ email: req.decoded.email });
//     const isAdmin = user?.role === "admin";
//     const isAssignedRider = req.decoded.email === parcel.assignedRiderEmail;

//     if (!isOwner && !isAdmin && !isAssignedRider) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     res.json(serializeDoc(parcel));
//   } catch (error) {
//     sendServerError(res, "Error fetching parcel", error);
//   }
// });

// app.delete("/parcels/:id", verifyFBToken, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "parcel id", res)) return;

//     const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

//     if (!parcel) {
//       return res.status(404).json({ message: "Parcel not found" });
//     }

//     if (req.decoded.email !== parcel.userEmail) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const result = await parcelsCollection.deleteOne({ _id: toObjectId(id) });

//     res.json({ deletedCount: result.deletedCount });
//   } catch (error) {
//     sendServerError(res, "Error deleting parcel", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                              Stripe Payment Routes                         */
// /* -------------------------------------------------------------------------- */

// app.post("/create-payment-intent", verifyFBToken, async (req, res) => {
//   try {
//     const { parcelId } = req.body;

//     if (!parcelId) {
//       return res.status(400).json({ message: "parcelId is required" });
//     }

//     if (!validateObjectId(parcelId, "parcelId", res)) return;

//     const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });

//     if (!parcel) {
//       return res.status(404).json({ message: "Parcel not found" });
//     }

//     if (req.decoded.email !== parcel.userEmail) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     if (parcel.paymentStatus === "paid") {
//       return res.status(400).json({ message: "Parcel already paid" });
//     }

//     const takaAmount = Number(parcel.cost || parcel.price || parcel.amountTaka || 0);

//     if (!Number.isFinite(takaAmount) || takaAmount <= 0) {
//       return res.status(400).json({ message: "Invalid parcel amount" });
//     }

//     const amountInCents = convertTakaToUsdCents(takaAmount);
//     const usdAmount = Number((amountInCents / 100).toFixed(2));

//     if (amountInCents < 50) {
//       return res.status(400).json({
//         message: "Minimum payable amount is 60 Tk (0.50 USD)",
//       });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amountInCents,
//       currency: "usd",
//       payment_method_types: ["card"],
//       metadata: {
//         parcelId,
//         userEmail: parcel.userEmail || "",
//         takaAmount: String(takaAmount),
//         usdAmount: usdAmount.toFixed(2),
//       },
//     });

//     res.json({
//       clientSecret: paymentIntent.client_secret,
//       amountInCents,
//       usdAmount,
//       takaAmount,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to create payment intent", error);
//   }
// });

// app.post("/payments", verifyFBToken, async (req, res) => {
//   try {
//     const paymentInfo = req.body;

//     const {
//       parcelId,
//       transactionId,
//       amountTaka,
//       amountUsd,
//       email,
//       paymentMethodId,
//       paymentMethod,
//       paymentIntentId,
//       status,
//     } = paymentInfo;

//     if (!parcelId || !transactionId) {
//       return res.status(400).json({
//         message: "parcelId and transactionId are required",
//       });
//     }

//     if (!validateObjectId(parcelId, "parcelId", res)) return;

//     if (req.decoded.email !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const existingPayment = await paymentsCollection.findOne({ transactionId });

//     if (existingPayment) {
//       return res.status(200).json({
//         message: "Payment already saved",
//         existing: true,
//       });
//     }

//     const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });

//     if (!parcel) {
//       return res.status(404).json({ message: "Parcel not found" });
//     }

//     if (req.decoded.email !== parcel.userEmail) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const paidAt = now();

//     const paymentDoc = {
//       parcelId,
//       transactionId,
//       amountTaka: Number(amountTaka),
//       amountUsd: Number(amountUsd),
//       email,
//       paymentMethodId,
//       paymentMethod: paymentMethod || "Card",
//       paymentIntentId,
//       status: status || "succeeded",
//       cashInStatus: "pending_admin_receive",
//       paidAt,
//       createdAt: now(),
//       parcelName: parcel?.parcelName || "",
//     };

//     const paymentResult = await paymentsCollection.insertOne(paymentDoc);

//     const updateResult = await parcelsCollection.updateOne(
//       { _id: toObjectId(parcelId) },
//       {
//         $set: {
//           paymentStatus: "paid",
//           transactionId,
//           amountTaka: Number(amountTaka),
//           amountUsd: Number(amountUsd),
//           paidAt,
//           updatedAt: now(),
//         },
//       }
//     );

//     await createNotification({
//       type: "cash_in",
//       title: "Cash in message",
//       message: `Payment received from user ${email}`,
//       recipientRole: "admin",
//       relatedId: parcelId,
//       relatedCollection: "payments",
//       meta: { transactionId, amountTaka: Number(amountTaka) },
//     });

//     res.status(201).json({
//       message: "Payment saved and parcel marked as paid",
//       paymentInsertResult: paymentResult,
//       parcelUpdateResult: updateResult,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to save payment", error);
//   }
// });

// app.get("/payments/:email", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.params.email;

//     if (!validateEmail(email, res)) return;

//     if (req.decoded.email !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const payments = await paymentsCollection
//       .find({ email })
//       .sort({ paidAt: -1 })
//       .toArray();

//     res.json(payments.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch payments", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                            Rider Account Routes                            */
// /* -------------------------------------------------------------------------- */

// app.post("/rider-accounts", verifyFBToken, async (req, res) => {
//   try {
//     const {
//       email,
//       picture,
//       phone,
//       vehicleType,
//       nid,
//       hub,
//       region,
//       age,
//       name,
//     } = req.body;

//     if (!validateEmail(email, res)) return;

//     if (req.decoded.email !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const riderExists = await riderAccountsCollection.findOne({ email });

//     if (riderExists) {
//       return res.status(200).send({
//         message: "Rider profile already exists",
//         inserted: false,
//         riderExists: true,
//       });
//     }

//     const riderDoc = {
//       name: name || "",
//       email,
//       age: age || "",
//       phone: phone || "",
//       nid: nid || "",
//       region: region || "",
//       hub: hub || "",
//       vehicleType: vehicleType || "",
//       picture: picture || "",
//       role: "rider",
//       status: "active",
//       approvalStatus: "pending",
//       workStatus: "free",
//       created_at: now(),
//       updated_at: now(),
//     };

//     const result = await riderAccountsCollection.insertOne(riderDoc);

//     await usersCollection.updateOne(
//       { email },
//       {
//         $set: {
//           role: "rider",
//           updated_at: now(),
//         },
//       }
//     );

//     await createNotification({
//       type: "rider_request",
//       title: "New rider request",
//       message: `New rider application from ${email}`,
//       recipientRole: "admin",
//       relatedId: result.insertedId.toString(),
//       relatedCollection: "riderAccounts",
//       meta: { email },
//     });

//     res.status(201).send({
//       message: "Rider profile created successfully",
//       inserted: true,
//       result,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to create rider account", error);
//   }
// });

// app.get("/rider-accounts/:email", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.params.email;

//     if (!validateEmail(email, res)) return;

//     const requesterEmail = req.decoded.email;
//     const user = await usersCollection.findOne({ email: requesterEmail });
//     const isAdmin = user?.role === "admin";

//     if (!isAdmin && requesterEmail !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const rider = await riderAccountsCollection.findOne({ email });

//     if (!rider) {
//       return res.status(404).send({ message: "Rider not found" });
//     }

//     res.send(serializeDoc(rider));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider account", error);
//   }
// });

// app.patch("/rider-accounts/profile", verifyFBToken, async (req, res) => {
//   try {
//     const {
//       email,
//       name,
//       age,
//       phone,
//       picture,
//       vehicleType,
//       nid,
//       hub,
//       region,
//       status,
//     } = req.body;

//     if (!validateEmail(email, res)) return;

//     if (req.decoded.email !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const result = await riderAccountsCollection.updateOne(
//       { email },
//       {
//         $set: {
//           name: name || "",
//           age: age || "",
//           phone: phone || "",
//           picture: picture || "",
//           vehicleType: vehicleType || "",
//           nid: nid || "",
//           hub: hub || "",
//           region: region || "",
//           ...(status ? { status } : {}),
//           updated_at: now(),
//         },
//       }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).send({ message: "Rider not found" });
//     }

//     res.send({
//       message: "Rider profile updated successfully",
//       result,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to update rider profile", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                              Rider Task Helpers                            */
// /* -------------------------------------------------------------------------- */

// const createRiderTask = async ({ parcel, rider, adminEmail, adminMessage = "" }) => {
//   const parcelId = parcel._id.toString();

//   const newTask = {
//     parcelId,
//     trackingId: parcel.trackingId || "",
//     riderId: rider._id.toString(),
//     riderEmail: rider.email,
//     riderName: rider.name || "",
//     riderPhone: rider.phone || "",
//     customerName: parcel.senderName || "",
//     customerPhone: parcel.senderPhone || "",
//     pickupLocation: parcel.senderCenter || parcel.senderAddress || "",
//     deliveryLocation: parcel.receiverCenter || parcel.receiverAddress || "",
//     senderInfo: {
//       name: parcel.senderName || "",
//       phone: parcel.senderPhone || "",
//       address: parcel.senderAddress || "",
//       center: parcel.senderCenter || "",
//     },
//     receiverInfo: {
//       name: parcel.receiverName || "",
//       phone: parcel.receiverPhone || "",
//       address: parcel.receiverAddress || "",
//       center: parcel.receiverCenter || "",
//     },
//     parcelInfo: {
//       type: parcel.parcelType || parcel.type || "",
//       weight: parcel.weight || "",
//       cost: Number(parcel.cost || parcel.amountTaka || 0),
//       paymentStatus: parcel.paymentStatus || "unpaid",
//     },
//     adminMessage,
//     status: "assigned",
//     assignedBy: adminEmail,
//     assignedAt: now(),
//     updatedAt: now(),
//     completedAt: null,
//   };

//   const result = await riderTasksCollection.insertOne(newTask);

//   await parcelsCollection.updateOne(
//     { _id: parcel._id },
//     {
//       $set: {
//         assignedRiderId: rider._id.toString(),
//         assignedRiderEmail: rider.email,
//         assignedRiderName: rider.name || "",
//         deliveryStatus: "assigned",
//         parcelCurrentStatus: "assigned",
//         updatedAt: now(),
//       },
//     }
//   );

//   await riderAccountsCollection.updateOne(
//     { email: rider.email },
//     {
//       $set: {
//         workStatus: "busy",
//         updated_at: now(),
//       },
//     }
//   );

//   await createNotification({
//     type: "rider_assign",
//     title: "Rider assigned",
//     message: `Parcel assigned to rider ${rider.email}`,
//     recipientRole: "admin",
//     relatedId: parcelId,
//     relatedCollection: "parcels",
//     meta: { riderEmail: rider.email },
//   });

//   await createNotification({
//     type: "rider_task_assigned",
//     title: "New delivery task assigned",
//     message: `You have been assigned parcel ${parcel.trackingId || parcelId}`,
//     recipientRole: "rider",
//     recipientEmail: rider.email,
//     relatedId: parcelId,
//     relatedCollection: "riderTasks",
//     meta: {
//       parcelId,
//       trackingId: parcel.trackingId || "",
//       senderName: parcel.senderName || "",
//       receiverName: parcel.receiverName || "",
//       adminMessage,
//     },
//   });

//   return result;
// };

// /* -------------------------------------------------------------------------- */
// /*                               Rider Task Routes                            */
// /* -------------------------------------------------------------------------- */

// app.patch(
//   "/admin/parcels/:parcelId/assign-rider",
//   verifyFBToken,
//   verifyAdmin,
//   async (req, res) => {
//     try {
//       const { parcelId } = req.params;
//       const { riderId, message } = req.body;

//       if (!parcelId || !riderId) {
//         return res
//           .status(400)
//           .send({ message: "parcelId and riderId are required" });
//       }

//       if (!validateObjectId(parcelId, "parcelId", res)) return;
//       if (!validateObjectId(riderId, "riderId", res)) return;

//       const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });

//       if (!parcel) {
//         return res.status(404).send({ message: "Parcel not found" });
//       }

//       if (parcel.assignedRiderEmail) {
//         return res
//           .status(400)
//           .send({ message: "Parcel is already assigned to a rider" });
//       }

//       const rider = await riderAccountsCollection.findOne({ _id: toObjectId(riderId) });

//       if (!rider) {
//         return res.status(404).send({ message: "Rider not found" });
//       }

//       if (rider.approvalStatus !== "approved") {
//         return res.status(400).send({ message: "Rider is not approved" });
//       }

//       if (rider.workStatus === "busy") {
//         return res.status(400).send({ message: "Rider is already busy" });
//       }

//       const result = await createRiderTask({
//         parcel,
//         rider,
//         adminEmail: req.decoded.email,
//         adminMessage: message || "",
//       });

//       res.status(201).send({
//         message: "Rider assigned successfully",
//         insertedId: result.insertedId,
//       });
//     } catch (error) {
//       sendServerError(res, "Failed to assign rider", error);
//     }
//   }
// );

// app.post("/rider-tasks", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { parcelId, riderEmail } = req.body;

//     if (!parcelId || !riderEmail) {
//       return res
//         .status(400)
//         .send({ message: "parcelId and riderEmail are required" });
//     }

//     if (!validateObjectId(parcelId, "parcelId", res)) return;

//     const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });
//     if (!parcel) {
//       return res.status(404).send({ message: "Parcel not found" });
//     }

//     const rider = await riderAccountsCollection.findOne({ email: riderEmail });
//     if (!rider) {
//       return res.status(404).send({ message: "Rider not found" });
//     }

//     if (rider.approvalStatus !== "approved") {
//       return res.status(400).send({ message: "Rider is not approved" });
//     }

//     if (rider.workStatus === "busy") {
//       return res.status(400).send({ message: "Rider is already busy" });
//     }

//     const result = await createRiderTask({
//       parcel,
//       rider,
//       adminEmail: req.decoded.email,
//       adminMessage: req.body.message || "",
//     });

//     res.status(201).send({
//       message: "Rider task created successfully",
//       insertedId: result.insertedId,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to create rider task", error);
//   }
// });

// app.get("/rider-tasks", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const tasks = await riderTasksCollection.find().sort({ assignedAt: -1 }).toArray();
//     res.send(tasks.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider tasks", error);
//   }
// });

// app.get("/rider-tasks/rider/:email", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.params.email;

//     if (!validateEmail(email, res)) return;

//     const requesterEmail = req.decoded.email;
//     const user = await usersCollection.findOne({ email: requesterEmail });
//     const isAdmin = user?.role === "admin";

//     if (!isAdmin && requesterEmail !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const tasks = await riderTasksCollection
//       .find({ riderEmail: email })
//       .sort({ assignedAt: -1 })
//       .toArray();

//     res.send(tasks.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider tasks by rider", error);
//   }
// });

// app.patch("/rider-tasks/:id", verifyFBToken, verifyRiderOrAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, amount } = req.body;

//     if (!validateObjectId(id, "task id", res)) return;

//     if (!status) {
//       return res.status(400).send({ message: "status is required" });
//     }

//     const task = await riderTasksCollection.findOne({ _id: toObjectId(id) });

//     if (!task) {
//       return res.status(404).send({ message: "Task not found" });
//     }

//     if (!req.isAdmin && req.decoded.email !== task.riderEmail) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const nextStatus = normalizeStatus(status);

//     await riderTasksCollection.updateOne(
//       { _id: toObjectId(id) },
//       {
//         $set: {
//           status: nextStatus,
//           updatedAt: now(),
//           ...(nextStatus === "completed" ? { completedAt: now() } : {}),
//         },
//       }
//     );

//     const parcelStatusMap = {
//       assigned: "assigned",
//       taken: "taken",
//       shifted: "shifted",
//       "out for delivery": "out for delivery",
//       completed: "completed",
//       cancelled: "cancelled",
//     };

//     const parcelDeliveryStatus = parcelStatusMap[nextStatus] || nextStatus;

//     await parcelsCollection.updateOne(
//       { _id: toObjectId(task.parcelId) },
//       {
//         $set: {
//           deliveryStatus: parcelDeliveryStatus,
//           parcelCurrentStatus: parcelDeliveryStatus,
//           updatedAt: now(),
//         },
//       }
//     );

//     if (nextStatus === "completed") {
//       await riderAccountsCollection.updateOne(
//         { email: task.riderEmail },
//         { $set: { workStatus: "free", updated_at: now() } }
//       );

//       const existingEarning = await riderEarningsCollection.findOne({
//         parcelId: task.parcelId,
//         riderEmail: task.riderEmail,
//       });

//       if (!existingEarning) {
//         await riderEarningsCollection.insertOne({
//           riderEmail: task.riderEmail,
//           riderName: task.riderName || "",
//           parcelId: task.parcelId,
//           trackingId: task.trackingId || "",
//           amount: Number(amount || 50),
//           status: "unpaid",
//           createdAt: now(),
//           updatedAt: now(),
//         });
//       }
//     }

//     if (nextStatus === "cancelled") {
//       await riderAccountsCollection.updateOne(
//         { email: task.riderEmail },
//         { $set: { workStatus: "free", updated_at: now() } }
//       );

//       await parcelsCollection.updateOne(
//         { _id: toObjectId(task.parcelId) },
//         {
//           $set: {
//             assignedRiderId: null,
//             assignedRiderEmail: null,
//             assignedRiderName: null,
//             deliveryStatus: "pending",
//             parcelCurrentStatus: "pending",
//             updatedAt: now(),
//           },
//         }
//       );
//     }

//     await createNotification({
//       type: "rider_task_update",
//       title: "Rider task updated",
//       message: `Rider updated parcel status to ${nextStatus}`,
//       recipientRole: "admin",
//       relatedId: task.parcelId,
//       relatedCollection: "riderTasks",
//       meta: { riderEmail: task.riderEmail, status: nextStatus },
//     });

//     res.send({ message: "Task status updated successfully" });
//   } catch (error) {
//     sendServerError(res, "Failed to update rider task", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                             Rider Earnings Routes                          */
// /* -------------------------------------------------------------------------- */

// app.post("/rider-earnings", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { riderEmail, parcelId, amount } = req.body;

//     if (!riderEmail || !parcelId) {
//       return res
//         .status(400)
//         .send({ message: "riderEmail and parcelId are required" });
//     }

//     const existing = await riderEarningsCollection.findOne({ riderEmail, parcelId });

//     if (existing) {
//       return res.status(200).send({
//         message: "Rider earning already exists",
//         existing: true,
//       });
//     }

//     const newEarning = {
//       ...req.body,
//       amount: Number(amount || 0),
//       status: req.body.status || "unpaid",
//       createdAt: now(),
//       updatedAt: now(),
//     };

//     const result = await riderEarningsCollection.insertOne(newEarning);

//     res.status(201).send({
//       message: "Rider earning saved successfully",
//       insertedId: result.insertedId,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to save rider earning", error);
//   }
// });

// app.get("/rider-earnings/:email", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.params.email;

//     if (!validateEmail(email, res)) return;

//     const requesterEmail = req.decoded.email;
//     const user = await usersCollection.findOne({ email: requesterEmail });
//     const isAdmin = user?.role === "admin";

//     if (!isAdmin && requesterEmail !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const earnings = await riderEarningsCollection
//       .find({ riderEmail: email })
//       .sort({ createdAt: -1 })
//       .toArray();

//     res.send(earnings.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider earnings", error);
//   }
// });

// app.get("/rider-earnings-summary/:email", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.params.email;

//     if (!validateEmail(email, res)) return;

//     const requesterEmail = req.decoded.email;
//     const user = await usersCollection.findOne({ email: requesterEmail });
//     const isAdmin = user?.role === "admin";

//     if (!isAdmin && requesterEmail !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     const earnings = await riderEarningsCollection.find({ riderEmail: email }).toArray();

//     const totalEarnings = earnings.reduce(
//       (sum, item) => sum + Number(item.amount || 0),
//       0
//     );
//     const paidEarnings = earnings
//       .filter((item) => item.status === "paid")
//       .reduce((sum, item) => sum + Number(item.amount || 0), 0);
//     const unpaidEarnings = earnings
//       .filter((item) => item.status === "unpaid")
//       .reduce((sum, item) => sum + Number(item.amount || 0), 0);

//     res.send({
//       totalEarnings,
//       paidEarnings,
//       unpaidEarnings,
//       totalRecords: earnings.length,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider earnings summary", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                                 Admin Routes                               */
// /* -------------------------------------------------------------------------- */

// app.get("/admin/overview", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const [totalUsers, totalRiders, totalParcels, totalPayments] = await Promise.all([
//       usersCollection.countDocuments({ role: { $ne: "admin" } }),
//       riderAccountsCollection.countDocuments({}),
//       parcelsCollection.countDocuments({}),
//       paymentsCollection.countDocuments({}),
//     ]);

//     const [
//       pendingParcels,
//       completedParcels,
//       pendingRiders,
//       availableRiders,
//       busyRiders,
//       unpaidOrders,
//     ] = await Promise.all([
//       parcelsCollection.countDocuments({ deliveryStatus: "pending" }),
//       parcelsCollection.countDocuments({ deliveryStatus: "completed" }),
//       riderAccountsCollection.countDocuments({ approvalStatus: "pending" }),
//       riderAccountsCollection.countDocuments({
//         approvalStatus: "approved",
//         workStatus: "free",
//       }),
//       riderAccountsCollection.countDocuments({
//         approvalStatus: "approved",
//         workStatus: "busy",
//       }),
//       parcelsCollection.countDocuments({ paymentStatus: "unpaid" }),
//     ]);

//     const successfulPayments = await paymentsCollection.find({ status: "succeeded" }).toArray();
//     const totalCashIn = successfulPayments.reduce(
//       (sum, payment) => sum + Number(payment.amountTaka || 0),
//       0
//     );

//     const paidRiderEarnings = await riderEarningsCollection.find({ status: "paid" }).toArray();
//     const totalCashOut = paidRiderEarnings.reduce(
//       (sum, earning) => sum + Number(earning.amount || 0),
//       0
//     );

//     const recentNotifications = await notificationsCollection
//       .find({ recipientRole: "admin" })
//       .sort({ createdAt: -1 })
//       .limit(8)
//       .toArray();

//     res.send({
//       stats: {
//         totalUsers,
//         totalRiders,
//         totalParcels,
//         totalPayments,
//         pendingParcels,
//         completedParcels,
//         pendingRiders,
//         availableRiders,
//         busyRiders,
//         unpaidOrders,
//         totalCashIn,
//         totalCashOut,
//       },
//       recentNotifications: recentNotifications.map(serializeDoc),
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch admin overview", error);
//   }
// });

// app.get("/admin/users", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const search = req.query.search || "";

//     const query = search
//       ? {
//           $or: [
//             { name: { $regex: search, $options: "i" } },
//             { email: { $regex: search, $options: "i" } },
//             { phone: { $regex: search, $options: "i" } },
//           ],
//           role: { $ne: "admin" },
//         }
//       : { role: { $ne: "admin" } };

//     const users = await usersCollection.find(query).sort({ created_at: -1 }).toArray();

//     const enrichedUsers = await Promise.all(
//       users.map(async (user) => {
//         const totalParcels = await parcelsCollection.countDocuments({
//           userEmail: user.email,
//         });

//         return {
//           ...serializeDoc(user),
//           totalParcels,
//           accountStatus: user.status || "active",
//         };
//       })
//     );

//     res.send(enrichedUsers);
//   } catch (error) {
//     sendServerError(res, "Failed to fetch users", error);
//   }
// });

// app.get("/admin/users/:id", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "user id", res)) return;

//     const user = await usersCollection.findOne({ _id: toObjectId(id) });

//     if (!user) {
//       return res.status(404).send({ message: "User not found" });
//     }

//     const [parcelHistory, paymentHistory] = await Promise.all([
//       parcelsCollection.find({ userEmail: user.email }).sort({ createdAt: -1 }).toArray(),
//       paymentsCollection.find({ email: user.email }).sort({ paidAt: -1 }).toArray(),
//     ]);

//     res.send({
//       user: serializeDoc(user),
//       parcelHistory: parcelHistory.map(serializeDoc),
//       paymentHistory: paymentHistory.map(serializeDoc),
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch user details", error);
//   }
// });

// app.get("/admin/orders", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const search = req.query.search || "";
//     const status = req.query.status || "";
//     const query = {};

//     if (search) {
//       query.$or = [
//         { trackingId: { $regex: search, $options: "i" } },
//         { senderName: { $regex: search, $options: "i" } },
//         { receiverName: { $regex: search, $options: "i" } },
//         { userEmail: { $regex: search, $options: "i" } },
//       ];
//     }

//     if (status) {
//       query.deliveryStatus = normalizeStatus(status);
//     }

//     const orders = await parcelsCollection.find(query).sort({ createdAt: -1 }).toArray();
//     res.send(orders.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch orders", error);
//   }
// });

// app.get("/admin/orders/:id", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "order id", res)) return;

//     const order = await parcelsCollection.findOne({ _id: toObjectId(id) });

//     if (!order) {
//       return res.status(404).send({ message: "Order not found" });
//     }

//     const payment = order.transactionId
//       ? await paymentsCollection.findOne({ transactionId: order.transactionId })
//       : null;

//     res.send({
//       order: serializeDoc(order),
//       payment: serializeDoc(payment),
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch order details", error);
//   }
// });

// app.get("/admin/parcel-tracking", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const search = req.query.search || "";

//     const query = search
//       ? {
//           $or: [
//             { trackingId: { $regex: search, $options: "i" } },
//             { senderName: { $regex: search, $options: "i" } },
//             { receiverName: { $regex: search, $options: "i" } },
//           ],
//         }
//       : {};

//     const parcels = await parcelsCollection.find(query).sort({ createdAt: -1 }).toArray();
//     res.send(parcels.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch parcel tracking data", error);
//   }
// });

// app.get("/admin/parcel-tracking/:id", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "parcel id", res)) return;

//     const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

//     if (!parcel) {
//       return res.status(404).send({ message: "Parcel not found" });
//     }

//     const riderTask = await riderTasksCollection.findOne({ parcelId: id });

//     res.send({
//       parcel: serializeDoc(parcel),
//       riderTask: serializeDoc(riderTask),
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch parcel tracking details", error);
//   }
// });

// app.patch("/admin/parcel-tracking/:id/status", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!validateObjectId(id, "parcel id", res)) return;

//     if (!status) {
//       return res.status(400).send({ message: "status is required" });
//     }

//     const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

//     if (!parcel) {
//       return res.status(404).send({ message: "Parcel not found" });
//     }

//     const normalized = normalizeStatus(status);

//     await parcelsCollection.updateOne(
//       { _id: toObjectId(id) },
//       {
//         $set: {
//           deliveryStatus: normalized,
//           parcelCurrentStatus: normalized,
//           updatedAt: now(),
//         },
//       }
//     );

//     if (parcel.assignedRiderEmail) {
//       await riderTasksCollection.updateOne(
//         { parcelId: id, riderEmail: parcel.assignedRiderEmail },
//         {
//           $set: {
//             status: normalized,
//             updatedAt: now(),
//             ...(normalized === "completed" ? { completedAt: now() } : {}),
//           },
//         }
//       );
//     }

//     if (normalized === "completed" && parcel.assignedRiderEmail) {
//       await riderAccountsCollection.updateOne(
//         { email: parcel.assignedRiderEmail },
//         { $set: { workStatus: "free", updated_at: now() } }
//       );
//     }

//     await createNotification({
//       type: "parcel_status_update",
//       title: "Parcel status updated",
//       message: `Parcel ${parcel.trackingId || id} updated to ${normalized}`,
//       recipientRole: "admin",
//       relatedId: id,
//       relatedCollection: "parcels",
//       meta: { status: normalized },
//     });

//     res.send({ message: "Parcel status updated successfully" });
//   } catch (error) {
//     sendServerError(res, "Failed to update parcel status", error);
//   }
// });

// app.get("/admin/payments", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const payments = await paymentsCollection.find().sort({ paidAt: -1 }).toArray();

//     const items = await Promise.all(
//       payments.map(async (payment) => {
//         const parcel = isValidObjectId(payment.parcelId)
//           ? await parcelsCollection.findOne({ _id: toObjectId(payment.parcelId) })
//           : null;

//         return {
//           ...serializeDoc(payment),
//           parcel: serializeDoc(parcel),
//         };
//       })
//     );

//     const totalCashIn = payments.reduce((sum, p) => sum + Number(p.amountTaka || 0), 0);
//     const paidCount = payments.filter((p) => p.status === "succeeded").length;
//     const pendingAdminReceive = payments.filter(
//       (p) => p.cashInStatus === "pending_admin_receive"
//     ).length;

//     res.send({
//       summary: { totalCashIn, paidCount, pendingAdminReceive },
//       payments: items,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch admin payments", error);
//   }
// });

// app.patch("/admin/payments/:id/receive", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "payment id", res)) return;

//     const payment = await paymentsCollection.findOne({ _id: toObjectId(id) });

//     if (!payment) {
//       return res.status(404).send({ message: "Payment not found" });
//     }

//     await paymentsCollection.updateOne(
//       { _id: toObjectId(id) },
//       {
//         $set: {
//           cashInStatus: "received_by_admin",
//           cashReceivedAt: now(),
//         },
//       }
//     );

//     if (payment.parcelId && isValidObjectId(payment.parcelId)) {
//       await parcelsCollection.updateOne(
//         { _id: toObjectId(payment.parcelId) },
//         {
//           $set: {
//             cashReceivedByAdmin: true,
//             updatedAt: now(),
//           },
//         }
//       );
//     }

//     res.send({ message: "Payment received successfully by admin" });
//   } catch (error) {
//     sendServerError(res, "Failed to receive payment", error);
//   }
// });

// app.get("/admin/riders", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const search = req.query.search || "";
//     const approvalStatus = req.query.approvalStatus || "";
//     const query = {};

//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         { phone: { $regex: search, $options: "i" } },
//       ];
//     }

//     if (approvalStatus) {
//       query.approvalStatus = normalizeStatus(approvalStatus);
//     }

//     const riders = await riderAccountsCollection.find(query).sort({ created_at: -1 }).toArray();
//     res.send(riders.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch riders", error);
//   }
// });

// app.get("/admin/parcels/unassigned", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const parcels = await parcelsCollection
//       .find({
//         $and: [
//           {
//             $or: [
//               { assignedRiderId: null },
//               { assignedRiderId: { $exists: false } },
//               { assignedRiderId: "" },
//             ],
//           },
//           {
//             $or: [
//               { assignedRiderEmail: null },
//               { assignedRiderEmail: { $exists: false } },
//               { assignedRiderEmail: "" },
//             ],
//           },
//           { deliveryStatus: { $in: ["pending", "unassigned"] } },
//         ],
//       })
//       .sort({ createdAt: -1 })
//       .toArray();

//     res.send(parcels.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch unassigned parcels", error);
//   }
// });

// app.get("/admin/riders/available", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const riders = await riderAccountsCollection
//       .find({ approvalStatus: "approved", workStatus: "free" })
//       .toArray();

//     res.send(riders.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch available riders", error);
//   }
// });

// app.get("/admin/riders/:id", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "rider id", res)) return;

//     const rider = await riderAccountsCollection.findOne({ _id: toObjectId(id) });

//     if (!rider) {
//       return res.status(404).send({ message: "Rider not found" });
//     }

//     const [tasks, earnings] = await Promise.all([
//       riderTasksCollection.find({ riderEmail: rider.email }).sort({ assignedAt: -1 }).toArray(),
//       riderEarningsCollection.find({ riderEmail: rider.email }).sort({ createdAt: -1 }).toArray(),
//     ]);

//     res.send({
//       rider: serializeDoc(rider),
//       tasks: tasks.map(serializeDoc),
//       earnings: earnings.map(serializeDoc),
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider details", error);
//   }
// });

// app.patch("/admin/riders/:id/approval", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { approvalStatus } = req.body;

//     if (!validateObjectId(id, "rider id", res)) return;

//     const normalized = normalizeStatus(approvalStatus);

//     if (!["approved", "declined", "pending"].includes(normalized)) {
//       return res.status(400).send({ message: "Invalid approvalStatus" });
//     }

//     const rider = await riderAccountsCollection.findOne({ _id: toObjectId(id) });

//     if (!rider) {
//       return res.status(404).send({ message: "Rider not found" });
//     }

//     const updateDoc = {
//       approvalStatus: normalized,
//       updated_at: now(),
//     };

//     if (normalized === "approved") {
//       updateDoc.workStatus = "free";
//     }

//     await riderAccountsCollection.updateOne(
//       { _id: toObjectId(id) },
//       { $set: updateDoc }
//     );

//     await createNotification({
//       type: "rider_approval",
//       title: "Rider approval updated",
//       message: `Rider ${rider.email} status changed to ${normalized}`,
//       recipientRole: "admin",
//       relatedId: id,
//       relatedCollection: "riderAccounts",
//       meta: { approvalStatus: normalized },
//     });

//     res.send({ message: "Rider approval updated successfully" });
//   } catch (error) {
//     sendServerError(res, "Failed to update rider approval", error);
//   }
// });

// app.get("/admin/rider-payments", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const riders = await riderAccountsCollection.find({}).toArray();

//     const result = await Promise.all(
//       riders.map(async (rider) => {
//         const earnings = await riderEarningsCollection
//           .find({ riderEmail: rider.email })
//           .toArray();

//         const totalCompletedParcels = earnings.length;
//         const totalPayment = earnings.reduce(
//           (sum, item) => sum + Number(item.amount || 0),
//           0
//         );
//         const paidAmount = earnings
//           .filter((item) => item.status === "paid")
//           .reduce((sum, item) => sum + Number(item.amount || 0), 0);
//         const dueAmount = totalPayment - paidAmount;

//         return {
//           riderId: rider._id.toString(),
//           riderName: rider.name || "",
//           riderEmail: rider.email,
//           completedParcels: totalCompletedParcels,
//           totalPayment,
//           paidAmount,
//           dueAmount,
//           approvalStatus: rider.approvalStatus,
//           workStatus: rider.workStatus,
//         };
//       })
//     );

//     res.send(result);
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider payments", error);
//   }
// });

// app.patch("/admin/rider-payments/pay", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { riderEmail } = req.body;

//     if (!riderEmail) {
//       return res.status(400).send({ message: "riderEmail is required" });
//     }

//     const unpaidEarnings = await riderEarningsCollection
//       .find({ riderEmail, status: "unpaid" })
//       .toArray();

//     if (!unpaidEarnings.length) {
//       return res.status(400).send({ message: "No unpaid earnings found" });
//     }

//     const totalPaidNow = unpaidEarnings.reduce(
//       (sum, item) => sum + Number(item.amount || 0),
//       0
//     );

//     await riderEarningsCollection.updateMany(
//       { riderEmail, status: "unpaid" },
//       {
//         $set: {
//           status: "paid",
//           paidAt: now(),
//           updatedAt: now(),
//         },
//       }
//     );

//     await createNotification({
//       type: "cash_out",
//       title: "Cash out message",
//       message: `Cash out completed for rider ${riderEmail}`,
//       recipientRole: "admin",
//       relatedCollection: "riderEarnings",
//       meta: { riderEmail, totalPaidNow },
//     });

//     res.send({
//       message: "Rider payment completed successfully",
//       totalPaidNow,
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to pay rider", error);
//   }
// });

// app.get("/admin/rider-task-updates", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const tasks = await riderTasksCollection.find().sort({ updatedAt: -1 }).toArray();

//     const enrichedTasks = await Promise.all(
//       tasks.map(async (task) => {
//         const rider = await riderAccountsCollection.findOne({ email: task.riderEmail });

//         const parcel =
//           task.parcelId && ObjectId.isValid(task.parcelId)
//             ? await parcelsCollection.findOne({ _id: toObjectId(task.parcelId) })
//             : null;

//         return {
//           ...serializeDoc(task),
//           availability: rider?.workStatus || "unknown",
//           parcelName: parcel?.parcelName || parcel?.trackingId || "",
//         };
//       })
//     );

//     res.send(enrichedTasks);
//   } catch (error) {
//     sendServerError(res, "Failed to fetch rider task updates", error);
//   }
// });

// app.get("/admin/notifications", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const notifications = await notificationsCollection
//       .find({ recipientRole: "admin" })
//       .sort({ createdAt: -1 })
//       .toArray();

//     res.send(notifications.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch notifications", error);
//   }
// });

// app.get("/user/notification/unread-count", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.decoded?.email;

//     if (!email) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }

//     const count = await notificationsCollection.countDocuments({
//       recipientEmail: email,
//       isRead: false,
//     });

//     res.send({ count });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch unread count", error);
//   }
// });

// app.patch("/admin/notifications/:id/read", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!validateObjectId(id, "notification id", res)) return;

//     await notificationsCollection.updateOne(
//       { _id: toObjectId(id) },
//       { $set: { isRead: true, readAt: now() } }
//     );

//     res.send({ message: "Notification marked as read" });
//   } catch (error) {
//     sendServerError(res, "Failed to update notification", error);
//   }
// });

// app.get("/admin/dashboard-overview", verifyFBToken, verifyAdmin, async (req, res) => {
//   try {
//     const [
//       totalUsers,
//       totalRiders,
//       totalParcels,
//       completedParcels,
//       pendingParcels,
//       pendingRiders,
//       availableRiders,
//       unpaidOrders,
//     ] = await Promise.all([
//       usersCollection.countDocuments({ role: { $ne: "admin" } }),
//       riderAccountsCollection.countDocuments(),
//       parcelsCollection.countDocuments(),
//       parcelsCollection.countDocuments({ deliveryStatus: "completed" }),
//       parcelsCollection.countDocuments({ deliveryStatus: "pending" }),
//       riderAccountsCollection.countDocuments({ approvalStatus: "pending" }),
//       riderAccountsCollection.countDocuments({
//         approvalStatus: "approved",
//         workStatus: "free",
//       }),
//       parcelsCollection.countDocuments({ paymentStatus: "unpaid" }),
//     ]);

//     const payments = await paymentsCollection.find({ status: "succeeded" }).toArray();
//     const totalCashIn = payments.reduce((sum, item) => sum + Number(item.amountTaka || 0), 0);

//     const riderPayments = await riderEarningsCollection.find({ status: "paid" }).toArray();
//     const totalCashOut = riderPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

//     const notifications = await notificationsCollection
//       .find({ recipientRole: "admin" })
//       .sort({ createdAt: -1 })
//       .limit(6)
//       .toArray();

//     res.send({
//       stats: {
//         totalUsers,
//         totalRiders,
//         totalParcels,
//         completedParcels,
//         pendingParcels,
//         pendingRiders,
//         availableRiders,
//         unpaidOrders,
//         totalCashIn,
//         totalCashOut,
//       },
//       notifications: notifications.map(serializeDoc),
//     });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch dashboard overview", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                           Rider Notification Routes                        */
// /* -------------------------------------------------------------------------- */

// app.get("/rider/notifications", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.decoded?.email;

//     if (!email) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }

//     const notifications = await notificationsCollection
//       .find({
//         recipientRole: "rider",
//         recipientEmail: email,
//       })
//       .sort({ createdAt: -1 })
//       .limit(100)
//       .toArray();

//     res.send(notifications.map(serializeDoc));
//   } catch (error) {
//     sendServerError(res, "Failed to fetch notifications", error);
//   }
// });

// app.get("/rider/notifications/unread-count", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.decoded?.email;

//     if (!email) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }

//     const count = await notificationsCollection.countDocuments({
//       recipientRole: "rider",
//       recipientEmail: email,
//       isRead: false,
//     });

//     res.send({ count });
//   } catch (error) {
//     sendServerError(res, "Failed to fetch unread count", error);
//   }
// });

// app.patch("/rider/notifications/read-all", verifyFBToken, async (req, res) => {
//   try {
//     const email = req.decoded?.email;

//     if (!email) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }

//     await notificationsCollection.updateMany(
//       { recipientRole: "rider", recipientEmail: email, isRead: false },
//       { $set: { isRead: true, readAt: now() } }
//     );

//     res.send({ message: "All notifications marked as read" });
//   } catch (error) {
//     sendServerError(res, "Failed to mark notifications as read", error);
//   }
// });

// app.patch("/rider/notifications/:id/read", verifyFBToken, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const email = req.decoded?.email;

//     if (!validateObjectId(id, "notification id", res)) return;

//     const notification = await notificationsCollection.findOne({
//       _id: toObjectId(id),
//     });

//     if (!notification) {
//       return res.status(404).send({ message: "Notification not found" });
//     }

//     if (notification.recipientEmail !== email) {
//       return res.status(403).send({ message: "forbidden access" });
//     }

//     await notificationsCollection.updateOne(
//       { _id: toObjectId(id) },
//       { $set: { isRead: true, readAt: now() } }
//     );

//     res.send({ message: "Notification marked as read" });
//   } catch (error) {
//     sendServerError(res, "Failed to update notification", error);
//   }
// });

// /* -------------------------------------------------------------------------- */
// /*                                Start Server                                */
// /* -------------------------------------------------------------------------- */

// if (process.env.NODE_ENV !== "production") {
//   connectDB()
//     .then(() => {
//       app.listen(PORT, () => {
//         console.log(`Server running on port ${PORT}`);
//       });
//     })
//     .catch((error) => {
//       console.error("Failed to start server", error);
//     });
// }

// export default app;

























import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import Stripe from "stripe";
import admin from "firebase-admin";
import serviceAccount from "./firebase-admin-key.json" with { type: "json" };
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const TAKA_PER_USD = 120;

/* -------------------------------------------------------------------------- */
/*                                  Middleware                                */
/* -------------------------------------------------------------------------- */

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

/* -------------------------------------------------------------------------- */
/*                             Firebase Admin Init                            */
/* -------------------------------------------------------------------------- */

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/* -------------------------------------------------------------------------- */
/*                          Mail Sender                                 */
/* -------------------------------------------------------------------------- */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASS,
  },
});

/* -------------------------------------------------------------------------- */
/*                                   Stripe                                   */
/* -------------------------------------------------------------------------- */

if (!process.env.STRIPE_SECRET_KEY) {
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const now = () => new Date();

const toObjectId = (id) => new ObjectId(id);
const isValidObjectId = (id) => ObjectId.isValid(id);

const normalizeStatus = (value = "") => String(value).trim().toLowerCase();

const convertTakaToUsdCents = (taka) => {
  const numericTaka = Number(taka);
  return Math.round((numericTaka / TAKA_PER_USD) * 100);
};

const generateTrackingId = () =>
  `TRK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const serializeDoc = (doc) => {
  if (!doc) return doc;

  return {
    ...doc,
    _id: doc._id?.toString?.() || doc._id,
  };
};

/**
 * Generic reusable error response helper
 */
const sendServerError = (res, message, error) => {
  res.status(500).send({
    message,
    ...(error?.message ? { error: error.message } : {}),
  });
};

/**
 * Reusable helper for "email is required"
 */
const validateEmail = (email, res) => {
  if (!email) {
    res.status(400).send({ message: "Email is required" });
    return false;
  }
  return true;
};

/**
 * Reusable helper for ObjectId validation
 */
const validateObjectId = (id, label, res) => {
  if (!isValidObjectId(id)) {
    res.status(400).send({ message: `Invalid ${label}` });
    return false;
  }
  return true;
};

/**
 * Generate and save notification
 */
let notificationsCollection;

const createNotification = async ({
  type,
  title,
  message,
  recipientRole = "admin",
  recipientEmail = null,
  relatedId = null,
  relatedCollection = null,
  meta = {},
}) => {
  if (!notificationsCollection) return;

  await notificationsCollection.insertOne({
    type,
    title,
    message,
    recipientRole,
    recipientEmail,
    relatedId,
    relatedCollection,
    meta,
    isRead: false,
    createdAt: now(),
  });
};

/* -------------------------------------------------------------------------- */
/*                              MongoDB Connection                            */
/* -------------------------------------------------------------------------- */

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mesbahul01.jvrqgnw.mongodb.net/?retryWrites=true&w=majority&appName=Mesbahul01`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let usersCollection;
let riderAccountsCollection;
let parcelsCollection;
let paymentsCollection;
let otpCollection;
let riderTasksCollection;
let riderEarningsCollection;

async function connectDB() {
  await client.connect();
  await client.db("admin").command({ ping: 1 });

  const db = client.db("parcelDB");

  parcelsCollection = db.collection("parcels");
  paymentsCollection = db.collection("payments");
  usersCollection = db.collection("users");
  otpCollection = db.collection("otp_verifications");
  riderAccountsCollection = db.collection("riderAccounts");
  riderTasksCollection = db.collection("riderTasks");
  riderEarningsCollection = db.collection("riderEarnings");
  notificationsCollection = db.collection("notifications");

  await usersCollection.createIndex({ email: 1 }, { unique: true });
  await riderAccountsCollection.createIndex({ email: 1 }, { unique: true });
  await parcelsCollection.createIndex(
    { trackingId: 1 },
    { unique: true, sparse: true }
  );
  await paymentsCollection.createIndex(
    { transactionId: 1 },
    { unique: true, sparse: true }
  );
  await notificationsCollection.createIndex({ recipientRole: 1, createdAt: -1 });
}

/* -------------------------------------------------------------------------- */
/*                               Auth Middleware                              */
/* -------------------------------------------------------------------------- */

const verifyFBToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch {
    return res.status(403).send({ message: "forbidden access" });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const email = req.decoded?.email;

    if (!email) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(403).send({ message: "admin user not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).send({ message: "admin only access" });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    sendServerError(res, "Failed to verify admin", error);
  }
};

const verifyRiderOrAdmin = async (req, res, next) => {
  try {
    const email = req.decoded?.email;

    if (!email) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    const user = await usersCollection.findOne({ email });
    const rider = await riderAccountsCollection.findOne({ email });

    const isAdmin = user?.role === "admin";
    const isRider = !!rider;

    if (!isAdmin && !isRider) {
      return res.status(403).send({ message: "forbidden access" });
    }

    req.isAdmin = isAdmin;
    req.isRider = isRider;
    req.currentRider = rider || null;

    next();
  } catch (error) {
    sendServerError(res, "Failed to verify access", error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                    Root                                    */
/* -------------------------------------------------------------------------- */

app.get("/", (req, res) => {
  res.send("Parcel server is running!");
});

/* -------------------------------------------------------------------------- */
/*                                 User Routes                                */
/* -------------------------------------------------------------------------- */

app.post("/users", async (req, res) => {
  try {
    const { email, picture } = req.body;

    if (!validateEmail(email, res)) return;

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      const updateDoc = {
        $set: {
          last_login: now(),
          ...(picture ? { picture } : {}),
        },
      };

      const updateResult = await usersCollection.updateOne({ email }, updateDoc);

      return res.status(200).send({
        message: "User already exists",
        inserted: false,
        updateResult,
      });
    }

    const userDoc = {
      ...req.body,
      role: req.body.role || "user",
      picture: picture || "",
      created_at: now(),
      last_login: now(),
      updated_at: now(),
    };

    const result = await usersCollection.insertOne(userDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.patch("/users/last-login", verifyFBToken, async (req, res) => {
  try {
    const { email, picture } = req.body;

    if (!validateEmail(email, res)) return;

    if (req.decoded.email !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const updateDoc = {
      $set: {
        last_login: now(),
        ...(picture ? { picture } : {}),
      },
    };

    const result = await usersCollection.updateOne({ email }, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.patch("/users/profile", verifyFBToken, async (req, res) => {
  try {
    const { email, name, picture } = req.body;

    if (!validateEmail(email, res)) return;

    if (req.decoded.email !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const result = await usersCollection.updateOne(
      { email },
      {
        $set: {
          name: name || "",
          picture: picture || "",
          updated_at: now(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({
      message: "Profile updated successfully",
      result,
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                                  OTP Routes                                */
/* -------------------------------------------------------------------------- */

app.post("/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await otpCollection.deleteMany({ email });

    await otpCollection.insertOne({
      email,
      otp,
      createdAt: now(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verified: false,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 5 minutes.</p>`,
    });

    res.send({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

app.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).send({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpDoc = await otpCollection.findOne({ email, otp });

    if (!otpDoc) {
      return res.status(400).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date() > new Date(otpDoc.expiresAt)) {
      return res.status(400).send({
        success: false,
        message: "OTP expired",
      });
    }

    await otpCollection.updateOne(
      { _id: otpDoc._id },
      {
        $set: {
          verified: true,
        },
      }
    );

    res.send({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                                  Role Route                                */
/* -------------------------------------------------------------------------- */

app.get("/users/role/:email", async (req, res) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email, res)) return;

    const user = await usersCollection.findOne({ email });

    if (user) {
      return res.send({
        role: user.role || "user",
        isAdmin: user.role === "admin",
        isRider: user.role === "rider",
      });
    }

    const rider = await riderAccountsCollection.findOne({ email });

    if (rider) {
      return res.send({
        role: "rider",
        isAdmin: false,
        isRider: true,
      });
    }

    res.status(404).send({ message: "Account not found" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                             Parcel / Order Routes                          */
/* -------------------------------------------------------------------------- */

app.post("/parcels", verifyFBToken, async (req, res) => {
  try {
    const parcelData = req.body;

    if (req.decoded.email !== parcelData.userEmail) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const newParcel = {
      ...parcelData,
      trackingId: parcelData.trackingId || generateTrackingId(),
      paymentStatus: "unpaid",
      deliveryStatus: parcelData.deliveryStatus || "pending",
      transactionId: null,
      paidAt: null,
      assignedRiderId: null,
      assignedRiderEmail: null,
      assignedRiderName: null,
      cashReceivedByAdmin: false,
      parcelCurrentStatus: parcelData.deliveryStatus || "pending",
      createdAt: now(),
      updatedAt: now(),
    };

    const result = await parcelsCollection.insertOne(newParcel);

    await createNotification({
      type: "parcel_order",
      title: "New parcel order",
      message: `New parcel order placed by ${parcelData.userEmail}`,
      recipientRole: "admin",
      relatedId: result.insertedId,
      relatedCollection: "parcels",
      meta: { trackingId: newParcel.trackingId },
    });

    res.status(201).json({
      message: "Parcel saved successfully",
      insertedId: result.insertedId,
      trackingId: newParcel.trackingId,
    });
  } catch (error) {
    sendServerError(res, "Error saving parcel", error);
  }
});

app.get("/parcels", async (req, res) => {
  try {
    const parcels = await parcelsCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(parcels);
  } catch (error) {
    sendServerError(res, "Error fetching parcels", error);
  }
});

app.get("/parcels/user/:email", verifyFBToken, async (req, res) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email, res)) return;

    if (req.decoded.email !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const parcels = await parcelsCollection
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(parcels);
  } catch (error) {
    sendServerError(res, "Error fetching parcels", error);
  }
});

app.get("/parcels/:id", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "parcel id", res)) return;

    const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    const isOwner = req.decoded.email === parcel.userEmail;
    const user = await usersCollection.findOne({ email: req.decoded.email });
    const isAdmin = user?.role === "admin";
    const isAssignedRider = req.decoded.email === parcel.assignedRiderEmail;

    if (!isOwner && !isAdmin && !isAssignedRider) {
      return res.status(403).send({ message: "forbidden access" });
    }

    res.json(parcel);
  } catch (error) {
    sendServerError(res, "Error fetching parcel", error);
  }
});

app.delete("/parcels/:id", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "parcel id", res)) return;

    const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (req.decoded.email !== parcel.userEmail) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const result = await parcelsCollection.deleteOne({ _id: toObjectId(id) });

    res.json({ deletedCount: result.deletedCount });
  } catch (error) {
    sendServerError(res, "Error deleting parcel", error);
  }
});

/* -------------------------------------------------------------------------- */
/*                              Stripe Payment Routes                         */
/* -------------------------------------------------------------------------- */

app.post("/create-payment-intent", verifyFBToken, async (req, res) => {
  try {
    const { parcelId } = req.body;

    if (!parcelId) {
      return res.status(400).json({ message: "parcelId is required" });
    }

    if (!validateObjectId(parcelId, "parcelId", res)) return;

    const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (req.decoded.email !== parcel.userEmail) {
      return res.status(403).send({ message: "forbidden access" });
    }

    if (parcel.paymentStatus === "paid") {
      return res.status(400).json({ message: "Parcel already paid" });
    }

    const takaAmount = Number(parcel.cost || parcel.price || parcel.amountTaka || 0);

    if (!Number.isFinite(takaAmount) || takaAmount <= 0) {
      return res.status(400).json({ message: "Invalid parcel amount" });
    }

    const amountInCents = convertTakaToUsdCents(takaAmount);
    const usdAmount = Number((amountInCents / 100).toFixed(2));

    if (amountInCents < 50) {
      return res.status(400).json({
        message: "Minimum payable amount is 60 Tk (0.50 USD)",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        parcelId,
        userEmail: parcel.userEmail || "",
        takaAmount: String(takaAmount),
        usdAmount: usdAmount.toFixed(2),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amountInCents,
      usdAmount,
      takaAmount,
    });
  } catch (error) {
    sendServerError(res, "Failed to create payment intent", error);
  }
});

app.post("/payments", verifyFBToken, async (req, res) => {
  try {
    const paymentInfo = req.body;

    const {
      parcelId,
      transactionId,
      amountTaka,
      amountUsd,
      email,
      paymentMethodId,
      paymentMethod,
      paymentIntentId,
      status,
    } = paymentInfo;

    if (!parcelId || !transactionId) {
      return res.status(400).json({
        message: "parcelId and transactionId are required",
      });
    }

    if (!validateObjectId(parcelId, "parcelId", res)) return;

    if (req.decoded.email !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const existingPayment = await paymentsCollection.findOne({ transactionId });

    if (existingPayment) {
      return res.status(200).json({
        message: "Payment already saved",
        existing: true,
      });
    }

    const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    if (req.decoded.email !== parcel.userEmail) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const paidAt = now();

    const paymentDoc = {
      parcelId,
      transactionId,
      amountTaka: Number(amountTaka),
      amountUsd: Number(amountUsd),
      email,
      paymentMethodId,
      paymentMethod: paymentMethod || "Card",
      paymentIntentId,
      status: status || "succeeded",
      cashInStatus: "pending_admin_receive",
      paidAt,
      createdAt: now(),
      parcelName: parcel?.parcelName || "",
    };

    const paymentResult = await paymentsCollection.insertOne(paymentDoc);

    const updateResult = await parcelsCollection.updateOne(
      { _id: toObjectId(parcelId) },
      {
        $set: {
          paymentStatus: "paid",
          transactionId,
          amountTaka: Number(amountTaka),
          amountUsd: Number(amountUsd),
          paidAt,
          updatedAt: now(),
        },
      }
    );

    await createNotification({
      type: "cash_in",
      title: "Cash in message",
      message: `Payment received from user ${email}`,
      recipientRole: "admin",
      relatedId: parcelId,
      relatedCollection: "payments",
      meta: { transactionId, amountTaka: Number(amountTaka) },
    });

    res.status(201).json({
      message: "Payment saved and parcel marked as paid",
      paymentInsertResult: paymentResult,
      parcelUpdateResult: updateResult,
    });
  } catch (error) {
    sendServerError(res, "Failed to save payment", error);
  }
});

app.get("/payments/:email", verifyFBToken, async (req, res) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email, res)) return;

    if (req.decoded.email !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const payments = await paymentsCollection
      .find({ email })
      .sort({ paidAt: -1 })
      .toArray();

    res.json(payments);
  } catch (error) {
    sendServerError(res, "Failed to fetch payments", error);
  }
});

/* -------------------------------------------------------------------------- */
/*                            Rider Account Routes                            */
/* -------------------------------------------------------------------------- */

app.post("/rider-accounts", verifyFBToken, async (req, res) => {
  try {
    const {
      email,
      picture,
      phone,
      vehicleType,
      nid,
      hub,
      region,
      age,
      name,
    } = req.body;

    if (!validateEmail(email, res)) return;

    if (req.decoded.email !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const riderExists = await riderAccountsCollection.findOne({ email });

    if (riderExists) {
      return res.status(200).send({
        message: "Rider profile already exists",
        inserted: false,
        riderExists: true,
      });
    }

    const riderDoc = {
      name: name || "",
      email,
      age: age || "",
      phone: phone || "",
      nid: nid || "",
      region: region || "",
      hub: hub || "",
      vehicleType: vehicleType || "",
      picture: picture || "",
      role: "rider",
      status: "active",
      approvalStatus: "pending",
      workStatus: "free",
      created_at: now(),
      updated_at: now(),
    };

    const result = await riderAccountsCollection.insertOne(riderDoc);

    await usersCollection.updateOne(
      { email },
      {
        $set: {
          role: "rider",
          updated_at: now(),
        },
      }
    );

    await createNotification({
      type: "rider_request",
      title: "New rider request",
      message: `New rider application from ${email}`,
      recipientRole: "admin",
      relatedId: result.insertedId,
      relatedCollection: "riderAccounts",
      meta: { email },
    });

    res.status(201).send({
      message: "Rider profile created successfully",
      inserted: true,
      result,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/rider-accounts/:email", verifyFBToken, async (req, res) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email, res)) return;

    const requesterEmail = req.decoded.email;
    const user = await usersCollection.findOne({ email: requesterEmail });
    const isAdmin = user?.role === "admin";

    if (!isAdmin && requesterEmail !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const rider = await riderAccountsCollection.findOne({ email });

    if (!rider) {
      return res.status(404).send({ message: "Rider not found" });
    }

    res.send(rider);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.patch("/rider-accounts/profile", verifyFBToken, async (req, res) => {
  try {
    const {
      email,
      name,
      age,
      phone,
      picture,
      vehicleType,
      nid,
      hub,
      region,
      status,
    } = req.body;

    if (!validateEmail(email, res)) return;

    if (req.decoded.email !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const result = await riderAccountsCollection.updateOne(
      { email },
      {
        $set: {
          name: name || "",
          age: age || "",
          phone: phone || "",
          picture: picture || "",
          vehicleType: vehicleType || "",
          nid: nid || "",
          hub: hub || "",
          region: region || "",
          ...(status ? { status } : {}),
          updated_at: now(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Rider not found" });
    }

    res.send({
      message: "Rider profile updated successfully",
      result,
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to update rider profile",
      error: error.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                              Rider Task Helpers                            */
/* -------------------------------------------------------------------------- */

/**
 * Create a task for a rider and update related parcel/rider state.
 * This helper is shared by multiple endpoints.
 */
const createRiderTask = async ({ parcel, rider, adminEmail, adminMessage = "" }) => {
  const parcelId = parcel._id.toString();

  const newTask = {
    parcelId,
    trackingId: parcel.trackingId || "",
    riderId: rider._id.toString(),
    riderEmail: rider.email,
    riderName: rider.name || "",
    riderPhone: rider.phone || "",
    customerName: parcel.senderName || "",
    customerPhone: parcel.senderPhone || "",
    pickupLocation: parcel.senderCenter || parcel.senderAddress || "",
    deliveryLocation: parcel.receiverCenter || parcel.receiverAddress || "",
    senderInfo: {
      name: parcel.senderName || "",
      phone: parcel.senderPhone || "",
      address: parcel.senderAddress || "",
      center: parcel.senderCenter || "",
    },
    receiverInfo: {
      name: parcel.receiverName || "",
      phone: parcel.receiverPhone || "",
      address: parcel.receiverAddress || "",
      center: parcel.receiverCenter || "",
    },
    parcelInfo: {
      type: parcel.parcelType || parcel.type || "",
      weight: parcel.weight || "",
      cost: Number(parcel.cost || parcel.amountTaka || 0),
      paymentStatus: parcel.paymentStatus || "unpaid",
    },
    adminMessage,
    status: "assigned",
    assignedBy: adminEmail,
    assignedAt: now(),
    updatedAt: now(),
    completedAt: null,
  };

  const result = await riderTasksCollection.insertOne(newTask);

  await parcelsCollection.updateOne(
    { _id: parcel._id },
    {
      $set: {
        assignedRiderId: rider._id.toString(),
        assignedRiderEmail: rider.email,
        assignedRiderName: rider.name || "",
        deliveryStatus: "assigned",
        parcelCurrentStatus: "assigned",
        updatedAt: now(),
      },
    }
  );

  await riderAccountsCollection.updateOne(
    { email: rider.email },
    {
      $set: {
        workStatus: "busy",
        updated_at: now(),
      },
    }
  );

  await createNotification({
    type: "rider_assign",
    title: "Rider assigned",
    message: `Parcel assigned to rider ${rider.email}`,
    recipientRole: "admin",
    relatedId: parcelId,
    relatedCollection: "parcels",
    meta: { riderEmail: rider.email },
  });

  await createNotification({
    type: "rider_task_assigned",
    title: "New delivery task assigned",
    message: `You have been assigned parcel ${parcel.trackingId || parcelId}`,
    recipientRole: "rider",
    recipientEmail: rider.email,
    relatedId: parcelId,
    relatedCollection: "riderTasks",
    meta: {
      parcelId,
      trackingId: parcel.trackingId || "",
      senderName: parcel.senderName || "",
      receiverName: parcel.receiverName || "",
      adminMessage,
    },
  });

  return result;
};

/* -------------------------------------------------------------------------- */
/*                               Rider Task Routes                            */
/* -------------------------------------------------------------------------- */

app.patch(
  "/admin/parcels/:parcelId/assign-rider",
  verifyFBToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { parcelId } = req.params;
      const { riderId, message } = req.body;

      if (!parcelId || !riderId) {
        return res
          .status(400)
          .send({ message: "parcelId and riderId are required" });
      }

      if (!validateObjectId(parcelId, "parcelId", res)) return;
      if (!validateObjectId(riderId, "riderId", res)) return;

      const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });

      if (!parcel) {
        return res.status(404).send({ message: "Parcel not found" });
      }

      if (parcel.assignedRiderEmail) {
        return res
          .status(400)
          .send({ message: "Parcel is already assigned to a rider" });
      }

      const rider = await riderAccountsCollection.findOne({ _id: toObjectId(riderId) });

      if (!rider) {
        return res.status(404).send({ message: "Rider not found" });
      }

      if (rider.approvalStatus !== "approved") {
        return res.status(400).send({ message: "Rider is not approved" });
      }

      if (rider.workStatus === "busy") {
        return res.status(400).send({ message: "Rider is already busy" });
      }

      const result = await createRiderTask({
        parcel,
        rider,
        adminEmail: req.decoded.email,
        adminMessage: message || "",
      });

      res.status(201).send({
        message: "Rider assigned successfully",
        insertedId: result.insertedId,
      });
    } catch (error) {
      res.status(500).send({
        message: "Failed to assign rider",
        error: error.message,
      });
    }
  }
);

app.post("/rider-tasks", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { parcelId, riderEmail } = req.body;

    if (!parcelId || !riderEmail) {
      return res
        .status(400)
        .send({ message: "parcelId and riderEmail are required" });
    }

    if (!validateObjectId(parcelId, "parcelId", res)) return;

    const parcel = await parcelsCollection.findOne({ _id: toObjectId(parcelId) });

    if (!parcel) {
      return res.status(404).send({ message: "Parcel not found" });
    }

    const rider = await riderAccountsCollection.findOne({ email: riderEmail });

    if (!rider) {
      return res.status(404).send({ message: "Rider not found" });
    }

    if (rider.approvalStatus !== "approved") {
      return res.status(400).send({ message: "Rider is not approved" });
    }

    if (rider.workStatus === "busy") {
      return res.status(400).send({ message: "Rider is already busy" });
    }

    const result = await createRiderTask({
      parcel,
      rider,
      adminEmail: req.decoded.email,
      adminMessage: req.body.message || "",
    });

    res.status(201).send({
      message: "Rider task created successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to create rider task",
      error: error.message,
    });
  }
});

app.get("/rider-tasks", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const tasks = await riderTasksCollection.find().sort({ assignedAt: -1 }).toArray();
    res.send(tasks.map(serializeDoc));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/rider-tasks/rider/:email", verifyFBToken, async (req, res) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email, res)) return;

    const requesterEmail = req.decoded.email;
    const user = await usersCollection.findOne({ email: requesterEmail });
    const isAdmin = user?.role === "admin";

    if (!isAdmin && requesterEmail !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const tasks = await riderTasksCollection
      .find({ riderEmail: email })
      .sort({ assignedAt: -1 })
      .toArray();

    res.send(tasks.map(serializeDoc));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.patch("/rider-tasks/:id", verifyFBToken, verifyRiderOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount } = req.body;

    if (!validateObjectId(id, "task id", res)) return;

    if (!status) {
      return res.status(400).send({ message: "status is required" });
    }

    const task = await riderTasksCollection.findOne({ _id: toObjectId(id) });

    if (!task) {
      return res.status(404).send({ message: "Task not found" });
    }

    if (!req.isAdmin && req.decoded.email !== task.riderEmail) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const nextStatus = normalizeStatus(status);

    await riderTasksCollection.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          status: nextStatus,
          updatedAt: now(),
          ...(nextStatus === "completed" ? { completedAt: now() } : {}),
        },
      }
    );

    const parcelStatusMap = {
      assigned: "assigned",
      taken: "taken",
      shifted: "shifted",
      "out for delivery": "out for delivery",
      completed: "completed",
      cancelled: "cancelled",
    };

    const parcelDeliveryStatus = parcelStatusMap[nextStatus] || nextStatus;

    await parcelsCollection.updateOne(
      { _id: toObjectId(task.parcelId) },
      {
        $set: {
          deliveryStatus: parcelDeliveryStatus,
          parcelCurrentStatus: parcelDeliveryStatus,
          updatedAt: now(),
        },
      }
    );

    if (nextStatus === "completed") {
      await riderAccountsCollection.updateOne(
        { email: task.riderEmail },
        { $set: { workStatus: "free", updated_at: now() } }
      );

      const existingEarning = await riderEarningsCollection.findOne({
        parcelId: task.parcelId,
        riderEmail: task.riderEmail,
      });

      if (!existingEarning) {
        await riderEarningsCollection.insertOne({
          riderEmail: task.riderEmail,
          riderName: task.riderName || "",
          parcelId: task.parcelId,
          trackingId: task.trackingId || "",
          amount: Number(amount || 50),
          status: "unpaid",
          createdAt: now(),
          updatedAt: now(),
        });
      }
    }

    if (nextStatus === "cancelled") {
      await riderAccountsCollection.updateOne(
        { email: task.riderEmail },
        { $set: { workStatus: "free", updated_at: now() } }
      );

      await parcelsCollection.updateOne(
        { _id: toObjectId(task.parcelId) },
        {
          $set: {
            assignedRiderId: null,
            assignedRiderEmail: null,
            assignedRiderName: null,
            deliveryStatus: "pending",
            parcelCurrentStatus: "pending",
            updatedAt: now(),
          },
        }
      );
    }

    await createNotification({
      type: "rider_task_update",
      title: "Rider task updated",
      message: `Rider updated parcel status to ${nextStatus}`,
      recipientRole: "admin",
      relatedId: task.parcelId,
      relatedCollection: "riderTasks",
      meta: { riderEmail: task.riderEmail, status: nextStatus },
    });

    res.send({ message: "Task status updated successfully" });
  } catch (error) {
    res.status(500).send({
      message: "Failed to update rider task",
      error: error.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                             Rider Earnings Routes                          */
/* -------------------------------------------------------------------------- */

app.post("/rider-earnings", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { riderEmail, parcelId, amount } = req.body;

    if (!riderEmail || !parcelId) {
      return res
        .status(400)
        .send({ message: "riderEmail and parcelId are required" });
    }

    const existing = await riderEarningsCollection.findOne({ riderEmail, parcelId });

    if (existing) {
      return res.status(200).send({
        message: "Rider earning already exists",
        existing: true,
      });
    }

    const newEarning = {
      ...req.body,
      amount: Number(amount || 0),
      status: req.body.status || "unpaid",
      createdAt: now(),
      updatedAt: now(),
    };

    const result = await riderEarningsCollection.insertOne(newEarning);

    res.status(201).send({
      message: "Rider earning saved successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to save rider earning",
      error: error.message,
    });
  }
});

app.get("/rider-earnings/:email", verifyFBToken, async (req, res) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email, res)) return;

    const requesterEmail = req.decoded.email;
    const user = await usersCollection.findOne({ email: requesterEmail });
    const isAdmin = user?.role === "admin";

    if (!isAdmin && requesterEmail !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const earnings = await riderEarningsCollection
      .find({ riderEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(earnings.map(serializeDoc));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/rider-earnings-summary/:email", verifyFBToken, async (req, res) => {
  try {
    const email = req.params.email;

    if (!validateEmail(email, res)) return;

    const requesterEmail = req.decoded.email;
    const user = await usersCollection.findOne({ email: requesterEmail });
    const isAdmin = user?.role === "admin";

    if (!isAdmin && requesterEmail !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    const earnings = await riderEarningsCollection.find({ riderEmail: email }).toArray();

    const totalEarnings = earnings.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const paidEarnings = earnings
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const unpaidEarnings = earnings
      .filter((item) => item.status === "unpaid")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.send({
      totalEarnings,
      paidEarnings,
      unpaidEarnings,
      totalRecords: earnings.length,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                                 Admin Routes                               */
/* -------------------------------------------------------------------------- */

app.get("/admin/overview", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const [totalUsers, totalRiders, totalParcels, totalPayments] = await Promise.all([
      usersCollection.countDocuments({ role: { $ne: "admin" } }),
      riderAccountsCollection.countDocuments({}),
      parcelsCollection.countDocuments({}),
      paymentsCollection.countDocuments({}),
    ]);

    const [
      pendingParcels,
      completedParcels,
      pendingRiders,
      availableRiders,
      busyRiders,
      unpaidOrders,
    ] = await Promise.all([
      parcelsCollection.countDocuments({ deliveryStatus: "pending" }),
      parcelsCollection.countDocuments({ deliveryStatus: "completed" }),
      riderAccountsCollection.countDocuments({ approvalStatus: "pending" }),
      riderAccountsCollection.countDocuments({
        approvalStatus: "approved",
        workStatus: "free",
      }),
      riderAccountsCollection.countDocuments({
        approvalStatus: "approved",
        workStatus: "busy",
      }),
      parcelsCollection.countDocuments({ paymentStatus: "unpaid" }),
    ]);

    const successfulPayments = await paymentsCollection.find({ status: "succeeded" }).toArray();
    const totalCashIn = successfulPayments.reduce(
      (sum, payment) => sum + Number(payment.amountTaka || 0),
      0
    );

    const paidRiderEarnings = await riderEarningsCollection.find({ status: "paid" }).toArray();
    const totalCashOut = paidRiderEarnings.reduce(
      (sum, earning) => sum + Number(earning.amount || 0),
      0
    );

    const recentNotifications = await notificationsCollection
      .find({ recipientRole: "admin" })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    res.send({
      stats: {
        totalUsers,
        totalRiders,
        totalParcels,
        totalPayments,
        pendingParcels,
        completedParcels,
        pendingRiders,
        availableRiders,
        busyRiders,
        unpaidOrders,
        totalCashIn,
        totalCashOut,
      },
      recentNotifications,
    });
  } catch {
    res.status(500).send({ message: "Failed to fetch admin overview" });
  }
});

app.get("/admin/users", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
          role: { $ne: "admin" },
        }
      : { role: { $ne: "admin" } };

    const users = await usersCollection.find(query).sort({ created_at: -1 }).toArray();

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const totalParcels = await parcelsCollection.countDocuments({
          userEmail: user.email,
        });

        return {
          ...serializeDoc(user),
          totalParcels,
          accountStatus: user.status || "active",
        };
      })
    );

    res.send(enrichedUsers);
  } catch {
    res.status(500).send({ message: "Failed to fetch users" });
  }
});

app.get("/admin/users/:id", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "user id", res)) return;

    const user = await usersCollection.findOne({ _id: toObjectId(id) });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const [parcelHistory, paymentHistory] = await Promise.all([
      parcelsCollection.find({ userEmail: user.email }).sort({ createdAt: -1 }).toArray(),
      paymentsCollection.find({ email: user.email }).sort({ paidAt: -1 }).toArray(),
    ]);

    res.send({
      user: serializeDoc(user),
      parcelHistory: parcelHistory.map(serializeDoc),
      paymentHistory: paymentHistory.map(serializeDoc),
    });
  } catch {
    res.status(500).send({ message: "Failed to fetch user details" });
  }
});

app.get("/admin/orders", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";
    const query = {};

    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: "i" } },
        { senderName: { $regex: search, $options: "i" } },
        { receiverName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.deliveryStatus = normalizeStatus(status);
    }

    const orders = await parcelsCollection.find(query).sort({ createdAt: -1 }).toArray();
    res.send(orders.map(serializeDoc));
  } catch {
    res.status(500).send({ message: "Failed to fetch orders" });
  }
});

app.get("/admin/orders/:id", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "order id", res)) return;

    const order = await parcelsCollection.findOne({ _id: toObjectId(id) });

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const payment = order.transactionId
      ? await paymentsCollection.findOne({ transactionId: order.transactionId })
      : null;

    res.send({
      order: serializeDoc(order),
      payment: serializeDoc(payment),
    });
  } catch {
    res.status(500).send({ message: "Failed to fetch order details" });
  }
});

app.get("/admin/parcel-tracking", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { trackingId: { $regex: search, $options: "i" } },
            { senderName: { $regex: search, $options: "i" } },
            { receiverName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const parcels = await parcelsCollection.find(query).sort({ createdAt: -1 }).toArray();
    res.send(parcels.map(serializeDoc));
  } catch {
    res.status(500).send({ message: "Failed to fetch parcel tracking data" });
  }
});

app.get("/admin/parcel-tracking/:id", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "parcel id", res)) return;

    const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

    if (!parcel) {
      return res.status(404).send({ message: "Parcel not found" });
    }

    const riderTask = await riderTasksCollection.findOne({ parcelId: id });

    res.send({
      parcel: serializeDoc(parcel),
      riderTask: serializeDoc(riderTask),
    });
  } catch {
    res.status(500).send({ message: "Failed to fetch parcel tracking details" });
  }
});

app.patch("/admin/parcel-tracking/:id/status", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!validateObjectId(id, "parcel id", res)) return;

    if (!status) {
      return res.status(400).send({ message: "status is required" });
    }

    const parcel = await parcelsCollection.findOne({ _id: toObjectId(id) });

    if (!parcel) {
      return res.status(404).send({ message: "Parcel not found" });
    }

    const normalized = normalizeStatus(status);

    await parcelsCollection.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          deliveryStatus: normalized,
          parcelCurrentStatus: normalized,
          updatedAt: now(),
        },
      }
    );

    if (parcel.assignedRiderEmail) {
      await riderTasksCollection.updateOne(
        { parcelId: id, riderEmail: parcel.assignedRiderEmail },
        {
          $set: {
            status: normalized,
            updatedAt: now(),
            ...(normalized === "completed" ? { completedAt: now() } : {}),
          },
        }
      );
    }

    if (normalized === "completed" && parcel.assignedRiderEmail) {
      await riderAccountsCollection.updateOne(
        { email: parcel.assignedRiderEmail },
        { $set: { workStatus: "free", updated_at: now() } }
      );
    }

    await createNotification({
      type: "parcel_status_update",
      title: "Parcel status updated",
      message: `Parcel ${parcel.trackingId || id} updated to ${normalized}`,
      recipientRole: "admin",
      relatedId: id,
      relatedCollection: "parcels",
      meta: { status: normalized },
    });

    res.send({ message: "Parcel status updated successfully" });
  } catch {
    res.status(500).send({ message: "Failed to update parcel status" });
  }
});

app.get("/admin/payments", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const payments = await paymentsCollection.find().sort({ paidAt: -1 }).toArray();

    const items = await Promise.all(
      payments.map(async (payment) => {
        const parcel = isValidObjectId(payment.parcelId)
          ? await parcelsCollection.findOne({ _id: toObjectId(payment.parcelId) })
          : null;

        return {
          ...serializeDoc(payment),
          parcel: serializeDoc(parcel),
        };
      })
    );

    const totalCashIn = payments.reduce((sum, p) => sum + Number(p.amountTaka || 0), 0);
    const paidCount = payments.filter((p) => p.status === "succeeded").length;
    const pendingAdminReceive = payments.filter(
      (p) => p.cashInStatus === "pending_admin_receive"
    ).length;

    res.send({
      summary: { totalCashIn, paidCount, pendingAdminReceive },
      payments: items,
    });
  } catch {
    res.status(500).send({ message: "Failed to fetch admin payments" });
  }
});

app.patch("/admin/payments/:id/receive", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "payment id", res)) return;

    const payment = await paymentsCollection.findOne({ _id: toObjectId(id) });

    if (!payment) {
      return res.status(404).send({ message: "Payment not found" });
    }

    await paymentsCollection.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          cashInStatus: "received_by_admin",
          cashReceivedAt: now(),
        },
      }
    );

    if (payment.parcelId && isValidObjectId(payment.parcelId)) {
      await parcelsCollection.updateOne(
        { _id: toObjectId(payment.parcelId) },
        {
          $set: {
            cashReceivedByAdmin: true,
            updatedAt: now(),
          },
        }
      );
    }

    res.send({ message: "Payment received successfully by admin" });
  } catch {
    res.status(500).send({ message: "Failed to receive payment" });
  }
});

app.get("/admin/riders", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const search = req.query.search || "";
    const approvalStatus = req.query.approvalStatus || "";
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (approvalStatus) {
      query.approvalStatus = normalizeStatus(approvalStatus);
    }

    const riders = await riderAccountsCollection.find(query).sort({ created_at: -1 }).toArray();
    res.send(riders.map(serializeDoc));
  } catch {
    res.status(500).send({ message: "Failed to fetch riders" });
  }
});

/* -------------------------------------------------------------------------- */
/*                              Assign Rider APIs                             */
/* -------------------------------------------------------------------------- */

app.get("/admin/parcels/unassigned", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const parcels = await parcelsCollection
      .find({
        $and: [
          {
            $or: [
              { assignedRiderId: null },
              { assignedRiderId: { $exists: false } },
              { assignedRiderId: "" },
            ],
          },
          {
            $or: [
              { assignedRiderEmail: null },
              { assignedRiderEmail: { $exists: false } },
              { assignedRiderEmail: "" },
            ],
          },
          { deliveryStatus: { $in: ["pending", "unassigned"] } },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(parcels.map(serializeDoc));
  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch unassigned parcels",
      error: error.message,
    });
  }
});

app.get("/admin/riders/available", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const riders = await riderAccountsCollection
      .find({ approvalStatus: "approved", workStatus: "free" })
      .toArray();

    res.send(riders);
  } catch {
    res.status(500).send({ message: "Failed to fetch available riders" });
  }
});

app.get("/admin/riders/:id", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "rider id", res)) return;

    const rider = await riderAccountsCollection.findOne({ _id: toObjectId(id) });

    if (!rider) {
      return res.status(404).send({ message: "Rider not found" });
    }

    const [tasks, earnings] = await Promise.all([
      riderTasksCollection.find({ riderEmail: rider.email }).sort({ assignedAt: -1 }).toArray(),
      riderEarningsCollection.find({ riderEmail: rider.email }).sort({ createdAt: -1 }).toArray(),
    ]);

    res.send({
      rider: serializeDoc(rider),
      tasks: tasks.map(serializeDoc),
      earnings: earnings.map(serializeDoc),
    });
  } catch {
    res.status(500).send({ message: "Failed to fetch rider details" });
  }
});

app.patch("/admin/riders/:id/approval", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!validateObjectId(id, "rider id", res)) return;

    const normalized = normalizeStatus(approvalStatus);

    if (!["approved", "declined", "pending"].includes(normalized)) {
      return res.status(400).send({ message: "Invalid approvalStatus" });
    }

    const rider = await riderAccountsCollection.findOne({ _id: toObjectId(id) });

    if (!rider) {
      return res.status(404).send({ message: "Rider not found" });
    }

    const updateDoc = {
      approvalStatus: normalized,
      updated_at: now(),
    };

    if (normalized === "approved") {
      updateDoc.workStatus = "free";
    }

    await riderAccountsCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: updateDoc }
    );

    await createNotification({
      type: "rider_approval",
      title: "Rider approval updated",
      message: `Rider ${rider.email} status changed to ${normalized}`,
      recipientRole: "admin",
      relatedId: id,
      relatedCollection: "riderAccounts",
      meta: { approvalStatus: normalized },
    });

    res.send({ message: "Rider approval updated successfully" });
  } catch {
    res.status(500).send({ message: "Failed to update rider approval" });
  }
});

app.get("/admin/rider-payments", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const riders = await riderAccountsCollection.find({}).toArray();

    const result = await Promise.all(
      riders.map(async (rider) => {
        const earnings = await riderEarningsCollection
          .find({ riderEmail: rider.email })
          .toArray();

        const totalCompletedParcels = earnings.length;
        const totalPayment = earnings.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        );
        const paidAmount = earnings
          .filter((item) => item.status === "paid")
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const dueAmount = totalPayment - paidAmount;

        return {
          riderId: rider._id.toString(),
          riderName: rider.name || "",
          riderEmail: rider.email,
          completedParcels: totalCompletedParcels,
          totalPayment,
          paidAmount,
          dueAmount,
          approvalStatus: rider.approvalStatus,
          workStatus: rider.workStatus,
        };
      })
    );

    res.send(result);
  } catch {
    res.status(500).send({ message: "Failed to fetch rider payments" });
  }
});

app.patch("/admin/rider-payments/pay", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { riderEmail } = req.body;

    if (!riderEmail) {
      return res.status(400).send({ message: "riderEmail is required" });
    }

    const unpaidEarnings = await riderEarningsCollection
      .find({ riderEmail, status: "unpaid" })
      .toArray();

    if (!unpaidEarnings.length) {
      return res.status(400).send({ message: "No unpaid earnings found" });
    }

    const totalPaidNow = unpaidEarnings.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    await riderEarningsCollection.updateMany(
      { riderEmail, status: "unpaid" },
      {
        $set: {
          status: "paid",
          paidAt: now(),
          updatedAt: now(),
        },
      }
    );

    await createNotification({
      type: "cash_out",
      title: "Cash out message",
      message: `Cash out completed for rider ${riderEmail}`,
      recipientRole: "admin",
      relatedCollection: "riderEarnings",
      meta: { riderEmail, totalPaidNow },
    });

    res.send({
      message: "Rider payment completed successfully",
      totalPaidNow,
    });
  } catch {
    res.status(500).send({ message: "Failed to pay rider" });
  }
});

app.get("/admin/rider-task-updates", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const tasks = await riderTasksCollection.find().sort({ updatedAt: -1 }).toArray();

    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const rider = await riderAccountsCollection.findOne({ email: task.riderEmail });

        const parcel =
          task.parcelId && ObjectId.isValid(task.parcelId)
            ? await parcelsCollection.findOne({ _id: toObjectId(task.parcelId) })
            : null;

        return {
          ...task,
          availability: rider?.workStatus || "unknown",
          parcelName: parcel?.parcelName || parcel?.trackingId || "",
        };
      })
    );

    res.send(enrichedTasks);
  } catch {
    res.status(500).send({ message: "Failed to fetch rider task updates" });
  }
});

app.get("/admin/notifications", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const notifications = await notificationsCollection
      .find({ recipientRole: "admin" })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(notifications.map(serializeDoc));
  } catch {
    res.status(500).send({ message: "Failed to fetch notifications" });
  }
});

app.patch("/admin/notifications/:id/read", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id, "notification id", res)) return;

    await notificationsCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: { isRead: true, readAt: now() } }
    );

    res.send({ message: "Notification marked as read" });
  } catch {
    res.status(500).send({ message: "Failed to update notification" });
  }
});

app.get("/admin/dashboard-overview", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalRiders,
      totalParcels,
      completedParcels,
      pendingParcels,
      pendingRiders,
      availableRiders,
      unpaidOrders,
    ] = await Promise.all([
      usersCollection.countDocuments({ role: { $ne: "admin" } }),
      riderAccountsCollection.countDocuments(),
      parcelsCollection.countDocuments(),
      parcelsCollection.countDocuments({ deliveryStatus: "completed" }),
      parcelsCollection.countDocuments({ deliveryStatus: "pending" }),
      riderAccountsCollection.countDocuments({ approvalStatus: "pending" }),
      riderAccountsCollection.countDocuments({
        approvalStatus: "approved",
        workStatus: "free",
      }),
      parcelsCollection.countDocuments({ paymentStatus: "unpaid" }),
    ]);

    const payments = await paymentsCollection.find({ status: "succeeded" }).toArray();
    const totalCashIn = payments.reduce((sum, item) => sum + Number(item.amountTaka || 0), 0);

    const riderPayments = await riderEarningsCollection.find({ status: "paid" }).toArray();
    const totalCashOut = riderPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const notifications = await notificationsCollection
      .find({ recipientRole: "admin" })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.send({
      stats: {
        totalUsers,
        totalRiders,
        totalParcels,
        completedParcels,
        pendingParcels,
        pendingRiders,
        availableRiders,
        unpaidOrders,
        totalCashIn,
        totalCashOut,
      },
      notifications,
    });
  } catch {
    res.status(500).send({ message: "Failed to fetch dashboard overview" });
  }
});

/* -------------------------------------------------------------------------- */
/*                           Rider Notification Routes                        */
/* -------------------------------------------------------------------------- */

app.get("/rider/notifications", verifyFBToken, async (req, res) => {
  try {
    const email = req.decoded?.email;

    if (!email) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    const notifications = await notificationsCollection
      .find({
        recipientRole: "rider",
        recipientEmail: email,
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.send(notifications.map(serializeDoc));
  } catch {
    res.status(500).send({ message: "Failed to fetch notifications" });
  }
});

app.get("/rider/notifications/unread-count", verifyFBToken, async (req, res) => {
  try {
    const email = req.decoded?.email;

    if (!email) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    const count = await notificationsCollection.countDocuments({
      recipientRole: "rider",
      recipientEmail: email,
      isRead: false,
    });

    res.send({ count });
  } catch {
    res.status(500).send({ message: "Failed to fetch unread count" });
  }
});

app.patch("/rider/notifications/read-all", verifyFBToken, async (req, res) => {
  try {
    const email = req.decoded?.email;

    if (!email) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    await notificationsCollection.updateMany(
      { recipientRole: "rider", recipientEmail: email, isRead: false },
      { $set: { isRead: true, readAt: now() } }
    );

    res.send({ message: "All notifications marked as read" });
  } catch {
    res.status(500).send({ message: "Failed to mark notifications as read" });
  }
});

app.patch("/rider/notifications/:id/read", verifyFBToken, async (req, res) => {
  try {
    const { id } = req.params;
    const email = req.decoded?.email;

    if (!validateObjectId(id, "notification id", res)) return;

    const notification = await notificationsCollection.findOne({
      _id: toObjectId(id),
    });

    if (!notification) {
      return res.status(404).send({ message: "Notification not found" });
    }

    if (notification.recipientEmail !== email) {
      return res.status(403).send({ message: "forbidden access" });
    }

    await notificationsCollection.updateOne(
      { _id: toObjectId(id) },
      { $set: { isRead: true, readAt: now() } }
    );

    res.send({ message: "Notification marked as read" });
  } catch {
    res.status(500).send({ message: "Failed to update notification" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                Start Server                                */
/* -------------------------------------------------------------------------- */

connectDB()
  .then(() => {
    app.listen(PORT);
  })
  .catch(() => {});

// module.exports = app;

// if (require.main === module) {
//   app.listen(process.env.PORT || 3000, () => console.log('Server running'));
// }