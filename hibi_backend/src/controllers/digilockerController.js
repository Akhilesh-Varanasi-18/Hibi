const crypto = require('crypto');
const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');

const digilockerTokenSchema = require('../models/digilockerTokenSchema');
const digilockerVerifiedDocumentsSchema = require('../models/EmployeeSchemaManagement/digilockerVerifiedDocumentsSchema');

const { uploadToS3 } = require('../utils/s3Upload');
const { getISTDateAndTime } = require('../utils/timeFunction');
const logger = require('../utils/logger');

// Funtion to generate the authorize URL
const generateAuthorizationUrl = async (req, res) => {
    logger.info(`generateAuthorizationUrl call by ${req.user.employeeCode}`);
    try {
        const tokenExists = await digilockerTokenSchema.findOne({ employeeId: req.user._id });

        // If token exists and is not expired, return a message or the token
        if (tokenExists && tokenExists.accessToken && tokenExists.expiresIn) {
            const now = Date.now();
            const createdAt = new Date(tokenExists.createdAt).getTime();
            const expiresInMs = tokenExists.expiresIn * 1000;
            if (createdAt + expiresInMs > now) {
                return res.status(200).json({
                    message: "DigiLocker token is still valid. No need to re-authorize.",
                    tokenValid: true,
                    // accessToken: tokenExists.accessToken
                });
            }
        }

        // Rate limit: allow only once per hour
        if (tokenExists && tokenExists.lastAuthUrlRequestedAt) {
            const now = getISTDateAndTime().getTime();
            const lastRequested = new Date(tokenExists.lastAuthUrlRequestedAt).getTime();
            if (now - lastRequested < 60 * 60 * 1000) { // 1 hour
                return res.status(429).json({
                    error: "You can only request a DigiLocker authorization URL once per hour. Please try again later."
                });
            }
        }

        // Otherwise, generate a new authorization URL
        const codeVerifier = crypto.randomBytes(64).toString("hex");
        const client_id = process.env.DIGILOCKER_CLIENT_ID;
        const redirect_uri = process.env.DIGILOCKER_REDIRECT_URI;
        const state = crypto.randomBytes(16).toString("hex"); // CSRF protection
        const code_challenge = crypto
            .createHash("sha256")
            .update(codeVerifier)
            .digest("base64url");

        const code_challenge_method = "S256";
        const response_type = "code";

        const url = new URL("https://api.digitallocker.gov.in/public/oauth2/1/authorize");
        url.searchParams.append("client_id", client_id);
        url.searchParams.append("redirect_uri", redirect_uri);
        url.searchParams.append("state", state);
        url.searchParams.append("code_challenge", code_challenge);
        url.searchParams.append("code_challenge_method", code_challenge_method);
        url.searchParams.append("response_type", response_type);

        // Store codeVerifier, state, and lastAuthUrlRequestedAt in digilockerTokenSchema for later use
        if (tokenExists) {
            await digilockerTokenSchema.findByIdAndUpdate(tokenExists._id, {
                codeVerifier,
                state,
                lastAuthUrlRequestedAt: getISTDateAndTime()
            });
        } else {
            await digilockerTokenSchema.create({
                employeeId: req.user._id,
                orgId: req.user.orgId,
                codeVerifier,
                state,
                lastAuthUrlRequestedAt: getISTDateAndTime(),
                digilockerid: "pending",
                name: "pending",
                dob: "pending",
                gender: "pending",
                eaadhaar: "N",
                expiresIn: 0,
                tokenType: "pending",
                scope: "pending",
                accessToken: "pending"
            });
        }

        return res.status(200).json({ authorizationUrl: url.toString() });
    } catch (error) {
        logger.error(`Error in generateAuthorizationUrl: ${error.message}`);
        console.error("Error generating authorization URL:", error);
        return res.status(500).json({ error: "Internal Server Error", err: error });
    }
};


// Funtion to fetch the issued documents in digilocker
const fetchIssuedDocuments = async (accessToken) => {
    logger.info(`fetchIssuedDocuments call`);
    try {
        const userDocumentsUrl = "https://api.digitallocker.gov.in/public/oauth2/1/files/issued";
        const userDocumentsResponse = await fetch(userDocumentsUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        if (!userDocumentsResponse.ok) {
            throw new Error("Failed to fetch issued documents");
        }

        const documentsData = await userDocumentsResponse.json();

        return documentsData;
    } catch (error) {
        logger.error(`Error in fetchIssuedDocuments: ${error.message}`);
        console.error("Error fetching issued documents:", error);
        throw error;
    }
};

// Function to get the documents and store in our database
const saveDocumentsToDB = async (employeeId, access_token, documentsData, employeeCode) => {
    logger.info(`saveDocumentsToDB call for employee: ${employeeCode}`);
    try {
        for (const documentUri of documentsData) {

            const uriName = "issued/" + documentUri?.uri;

            // Find and delete any existing document with same employeeId and uri
            const oldDocs = await digilockerVerifiedDocumentsSchema.find({ employeeId, uri: documentUri?.uri });
            for (const oldDoc of oldDocs) {
                if (oldDoc.documentUrl) {
                    // Extract S3 key from documentUrl (everything after .amazonaws.com/)
                    const s3Key = oldDoc.documentUrl.split(".amazonaws.com/")[1];
                    if (s3Key) {
                        try {
                            const { deleteFromS3 } = require("../utils/s3Upload");
                            await deleteFromS3(s3Key);
                        } catch (err) {
                            console.error("Error deleting old S3 file:", err);
                        }
                    }
                }
                await digilockerVerifiedDocumentsSchema.findByIdAndDelete(oldDoc._id);
            }

            const fetchUrl = `https://api.digitallocker.gov.in/public/oauth2/1/file/${documentUri?.uri}`;
            const response = await fetch(fetchUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Accept": "*/*",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch document: ${name}`);
            }

            const contentType = response.headers.get("content-type");
            const documentBuffer = await response.buffer();


            // Upload to S3 with proper date formatting
            const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
            const { fileUrl, s3Key } = await uploadToS3(
                documentBuffer,
                `${documentUri?.uri}_${dateStr}`,
                contentType,
                `digilocker/${employeeCode ? employeeCode : employeeId}`
            );

            if (!fileUrl) {
                throw new Error("Failed to upload document to storage");
            }

            const { name, type, date, mime, doctype, description, issuerid, issuer, uri } = documentUri;

            // orgId is required, get from employee context (assume req.user.orgId is available via closure or pass as param)
            const orgId = (typeof employeeCode === 'object' && employeeCode.orgId) ? employeeCode.orgId : (employeeCode && employeeCode.orgId) ? employeeCode.orgId : (global.req && global.req.user && global.req.user.orgId) ? global.req.user.orgId : null;
            // fallback: pass orgId as an extra param to this function if needed
            // For now, get orgId from req.user.orgId (pass as param if needed)

            // If orgId is not available, try to get from token schema
            let finalOrgId = orgId;
            if (!finalOrgId) {
                // Try to get from digilockerTokenSchema
                const tokenRecord = await digilockerTokenSchema.findOne({ employeeId });
                if (tokenRecord && tokenRecord.orgId) {
                    finalOrgId = tokenRecord.orgId;
                }
            }

            if (!finalOrgId) {
                throw new Error("orgId is required to save DigilockerVerifiedDocuments");
            }

            const savingDocument = new digilockerVerifiedDocumentsSchema({
                orgId: finalOrgId,
                employeeId,
                name,
                type,
                date,
                mime,
                uri,
                doctype,
                description,
                issuerid,
                issuer,
                documentUrl: fileUrl,
                createdBy: employeeId,
                updatedBy: employeeId
            });
            await savingDocument.save();
            logger.info(`Document with name '${name}' saved by user ${employeeCode}`);
        }
    } catch (error) {
        logger.error(`Error in saveDocumentsToDB: ${error.message}`);
        console.error("Error saving documents to DB:", error);
        throw error;
    }
};


// Funtion to get access token
const getAccessToken = async (req, res) => {
    logger.info(`getAccessToken call by ${req.user.employeeCode}`);
    try {
        const { code } = req.query;
        // console.log(code, state);


        // Retrieve codeVerifier and state from digilockerTokenSchema
        const tokenRecord = await digilockerTokenSchema.findOne({ employeeId: req.user._id });
        if (!tokenRecord) {
            return res.status(400).json({ error: "Session expired or invalid. Please initiate DigiLocker login again." });
        }

        const employeeId = req.user && req.user._id ? req.user._id : undefined;
        const employeeCode = req.user && req.user.employeeCode ? req.user.employeeCode : undefined;
        if (!employeeId) {
            return res.status(400).json({ error: "User not authenticated. Cannot save DigiLocker tokens." });
        }

        // Check if access token is still valid
        if (tokenRecord.accessToken && tokenRecord.expiresIn && tokenRecord.createdAt) {
            const now = Date.now();
            const createdAt = new Date(tokenRecord.createdAt).getTime();
            const expiresInMs = tokenRecord.expiresIn * 1000;
            if (createdAt + expiresInMs > now) {
                // Token is still valid, use it to fetch documents
                const documentsData = await fetchIssuedDocuments(tokenRecord.accessToken);
                // console.log("Issued Documents Data: ", documentsData);
                await saveDocumentsToDB(employeeId, tokenRecord.accessToken, documentsData.items || [], employeeCode);
                return res.status(200).json({ message: "DigiLocker linked and issued documents fetched, saved successfully (using existing token)" });
            }
        }

        // If token is not valid, proceed to exchange code for new token
        if (!tokenRecord.codeVerifier || !tokenRecord.state) {
            return res.status(400).json({ error: "Session expired or invalid. Please initiate DigiLocker login again." });
        }
        const code_verifier = tokenRecord.codeVerifier;
        const client_id = process.env.DIGILOCKER_CLIENT_ID;
        const client_secret = process.env.DIGILOCKER_CLIENT_SECRET;
        const redirect_uri = process.env.DIGILOCKER_REDIRECT_URI;

        const tokenUrl = "https://api.digitallocker.gov.in/public/oauth2/1/token";
        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("redirect_uri", redirect_uri);
        params.append("code_verifier", code_verifier);

        // Create Basic Auth header
        const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        // Handle response (optional: parse and return to client)
        const data = await response.json();
        // console.log(data);
        if (!response.ok) {
            console.error("Error response from token endpoint:", data);
            return res.status(response.status).json({ error: data.error || "Failed to get access token", details: data });
        }
        // console.log("Access Token Response:", data);

        const {
            access_token, refresh_token, expires_in, token_type, scope,
            digilockerid, name, dob, gender, eaadhaar, referenceKey, mobile
        } = data;

        // Update the token record with new values
        await digilockerTokenSchema.findByIdAndUpdate(tokenRecord._id, {
            orgId: req.user.orgId,
            accessToken: access_token,
            refreshToken: refresh_token ? refresh_token : '',
            expiresIn: expires_in,
            tokenType: token_type,
            scope,
            digilockerid,
            name,
            dob,
            gender,
            eaadhaar,
            referenceKey,
            mobile,
            updatedAt: getISTDateAndTime()
        });

        // Fetch issued documents using the new access token
        const documentsData = await fetchIssuedDocuments(access_token);
        // console.log("Issued Documents Data: ", documentsData);
        await saveDocumentsToDB(employeeId, access_token, documentsData.items || [], employeeCode);

        return res.status(200).json({ message: "DigiLocker linked and issued documents fetched, saved successfully (using new token)" });
    } catch (error) {
        logger.error(`Error in getAccessToken: ${error.message}`);
        console.error("Error getting access token:", error);
        return res.status(500).json({ error: "Internal Server Error", err: error });
    }
};

// Function to get the documents
const getDocuments = async (req, res) => {
    logger.info(`getDocuments call by ${req.user.employeeCode}`);
    try {
        let employeeId = req?.user?._id;
        if (req.query.employeeId) {
            employeeId = req.query.employeeId;
        }
        const orgId = req?.user?.orgId;

        // Fetch documents from the database
        const documents = await digilockerVerifiedDocumentsSchema.find({ employeeId, orgId }, {
            createdAt: 0,
            updatedAt: 0,
            createdBy: 0,
            updatedBy: 0,
            __v: 0
        });
        return res.status(200).json({ message: "Documents fetched successfully", documents });

    } catch (error) {
        logger.error(`Error in getDocuments: ${error.message}`);
        console.error("Error getting documents:", error);
        return res.status(500).json({ error: "Internal Server Error", err: error });
    }
}

// Function to refetch documents
const refetchDocuments = async (req, res) => {
    logger.info(`refetchDocuments call by ${req.user.employeeCode}`);
    try {
        const tokenRecord = await digilockerTokenSchema.findOne({ employeeId: req.user._id });
        if (!tokenRecord || !tokenRecord.accessToken || !tokenRecord.expiresIn || !tokenRecord.createdAt) {
            return res.status(400).json({ error: "No valid DigiLocker token found. Please authorize again." });
        }

        // Rate limit: allow only once per 10 minutes
        if (tokenRecord.lastRefetchRequestedAt) {
            const now = getISTDateAndTime().getTime();
            const lastRequested = new Date(tokenRecord.lastRefetchRequestedAt).getTime();
            if (now - lastRequested < 10 * 60 * 1000) { // 10 minutes
                return res.status(429).json({
                    error: "You can only refetch DigiLocker documents once every 10 minutes. Please try again later."
                });
            }
        }

        // Check if access token is still valid
        const now = Date.now();
        const createdAt = new Date(tokenRecord.updatedAt).getTime();
        const expiresInMs = tokenRecord.expiresIn * 1000;
        if (now >= createdAt + expiresInMs) {
            return res.status(401).json({ error: "Access token expired. Please re-authorize DigiLocker." });
        }

        // Token is valid, fetch documents
        const employeeId = req.user._id;
        const employeeCode = req.user.employeeCode;
        const documentsData = await fetchIssuedDocuments(tokenRecord.accessToken);
        await saveDocumentsToDB(employeeId, tokenRecord.accessToken, documentsData.items || [], employeeCode);

        // Update lastRefetchRequestedAt
        await digilockerTokenSchema.findByIdAndUpdate(tokenRecord._id, {
            lastRefetchRequestedAt: getISTDateAndTime()
        });

        return res.status(200).json({ message: "Documents refetched and saved successfully (using existing token)" });
    } catch (error) {
        logger.error(`Error in refetchDocuments: ${error.message}`);
        console.error("Error refetching documents:", error);
        return res.status(500).json({ error: "Internal Server Error", err: error });
    }
};

module.exports = {
    generateAuthorizationUrl,
    getAccessToken,
    getDocuments,
    refetchDocuments
};