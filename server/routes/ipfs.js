import express from 'express';
import PinataSDK from '@pinata/sdk';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and JSON files
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/json', 'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, JSON and text files are allowed'), false);
    }
  }
});

// Initialize Pinata client with JWT - CONSISTENT with main server
const getPinataClient = () => {
  const jwtToken = process.env.PINATA_JWT;
  
  if (!jwtToken) {
    throw new Error('PINATA_JWT environment variable not configured');
  }
  
  // Use the same constructor pattern as main server
  return new PinataSDK({
    pinataJWTKey: jwtToken,
    pinataGateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud'
  });
};

// Upload single file to IPFS via Pinata
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 IPFS upload request:', {
      hasFile: !!req.file,
      filename: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype,
      user: req.user?.walletAddress
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const pinata = getPinataClient();
    
    // Convert buffer to readable stream for Pinata SDK
    const { Readable } = await import('stream');
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null); // End the stream
    
    // Add filename to the stream object
    readableStream.path = req.file.originalname;
    
    // Use pinFileToIPFS with proper stream
    const result = await pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: {
        name: req.file.originalname,
        keyvalues: {
          uploadedBy: req.user?.walletAddress || 'anonymous',
          uploadDate: new Date().toISOString(),
          fileSize: req.file.size.toString(),
          mimeType: req.file.mimetype
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    });
    
    const ipfsHash = result.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    console.log('✅ IPFS upload successful:', { ipfsHash, url: ipfsUrl });
    
    res.json({
      success: true,
      cid: ipfsHash,
      url: ipfsUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('❌ IPFS upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload to IPFS',
      details: error.message 
    });
  }
});

// Upload multiple files to IPFS via Pinata
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    console.log('📁 Multiple IPFS upload request:', {
      fileCount: req.files?.length || 0,
      user: req.user?.walletAddress
    });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }
    
    const pinata = getPinataClient();
    const { Readable } = await import('stream');
    
    const uploadPromises = req.files.map(async (file) => {
      try {
        // Convert buffer to readable stream
        const readableStream = new Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);
        readableStream.path = file.originalname;
        
        // Use pinFileToIPFS for consistency
        const result = await pinata.pinFileToIPFS(readableStream, {
          pinataMetadata: {
            name: file.originalname,
            keyvalues: {
              uploadedBy: req.user?.walletAddress || 'anonymous',
              uploadDate: new Date().toISOString(),
              fileSize: file.size.toString(),
              mimeType: file.mimetype
            }
          },
          pinataOptions: {
            cidVersion: 1
          }
        });
        
        return {
          success: true,
          filename: file.originalname,
          cid: result.IpfsHash,
          url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (error) {
        console.error(`❌ Failed to upload ${file.originalname}:`, error);
        return {
          success: false,
          filename: file.originalname,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ Multiple upload completed: ${successCount}/${req.files.length} files successful`);
    
    res.json({
      success: true,
      totalFiles: req.files.length,
      successfulUploads: successCount,
      results: results
    });
  } catch (error) {
    console.error('❌ Multiple IPFS upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload multiple files to IPFS',
      details: error.message 
    });
  }
});

// Upload JSON metadata to IPFS via Pinata
router.post('/upload-json', async (req, res) => {
  try {
    const { metadata, filename } = req.body;
    
    console.log('📄 IPFS JSON upload:', { filename, hasMetadata: !!metadata });
    
    if (!metadata) {
      return res.status(400).json({ error: 'No metadata provided' });
    }
    
    const pinata = getPinataClient();
    
    // Use pinJSONToIPFS for JSON data
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: filename || 'metadata.json',
        keyvalues: {
          uploadedBy: req.user?.walletAddress || 'anonymous',
          uploadDate: new Date().toISOString(),
          dataType: 'json'
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    });
    
    const ipfsHash = result.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    console.log('✅ IPFS JSON upload successful:', { ipfsHash, url: ipfsUrl });
    
    res.json({
      success: true,
      cid: ipfsHash,
      url: ipfsUrl,
      filename: filename || 'metadata.json'
    });
  } catch (error) {
    console.error('❌ IPFS JSON upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload JSON to IPFS',
      details: error.message 
    });
  }
});

// Upload certificate PDF to IPFS via Pinata
router.post('/upload-certificate', async (req, res) => {
  try {
    const { pdfData, certificateId, recipientName } = req.body;
    
    console.log('📜 IPFS certificate upload:', { certificateId, recipientName });
    
    if (!pdfData) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }
    
    const pinata = getPinataClient();
    const { Readable } = await import('stream');
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
    const filename = `certificate-${certificateId}.pdf`;
    
    // Convert buffer to readable stream
    const readableStream = new Readable();
    readableStream.push(pdfBuffer);
    readableStream.push(null);
    readableStream.path = filename;
    
    // Upload PDF to IPFS via Pinata using pinFileToIPFS
    const pdfResult = await pinata.pinFileToIPFS(readableStream, {
      pinataMetadata: {
        name: filename,
        keyvalues: {
          certificateId: certificateId,
          recipientName: recipientName,
          uploadDate: new Date().toISOString(),
          documentType: 'certificate'
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    });
    
    const pdfHash = pdfResult.IpfsHash;
    const pdfUrl = `https://gateway.pinata.cloud/ipfs/${pdfHash}`;
    
    // Create metadata for NFT
    const metadata = {
      name: `Certificate for ${recipientName}`,
      description: `Digital certificate issued to ${recipientName}`,
      image: pdfUrl,
      external_url: pdfUrl,
      attributes: [
        {
          trait_type: "Certificate ID",
          value: certificateId
        },
        {
          trait_type: "Recipient",
          value: recipientName
        },
        {
          trait_type: "Issue Date",
          value: new Date().toISOString()
        }
      ]
    };
    
    // Upload metadata to IPFS via Pinata using pinJSONToIPFS
    const metadataResult = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: `${certificateId}-metadata.json`,
        keyvalues: {
          certificateId: certificateId,
          recipientName: recipientName,
          uploadDate: new Date().toISOString(),
          dataType: 'nft-metadata'
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    });
    
    const metadataHash = metadataResult.IpfsHash;
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;
    
    console.log('✅ Certificate upload successful:', { pdfHash, metadataHash });
    
    res.json({
      success: true,
      pdfCid: pdfHash,
      metadataCid: metadataHash,
      pdfUrl: pdfUrl,
      metadataUrl: metadataUrl,
      filename
    });
  } catch (error) {
    console.error('❌ Certificate upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload certificate to IPFS',
      details: error.message 
    });
  }
});

// Upload directory/folder to IPFS via Pinata
router.post('/upload-directory', upload.array('files', 50), async (req, res) => {
  try {
    const { directoryName } = req.body;
    
    console.log('📁 IPFS directory upload:', { 
      directoryName,
      fileCount: req.files?.length || 0 
    });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided for directory' });
    }
    
    const pinata = getPinataClient();
    const { Readable } = await import('stream');
    
    // For directory uploads, we need to upload each file individually
    // and then create a directory structure
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Convert buffer to readable stream
        const readableStream = new Readable();
        readableStream.push(file.buffer);
        readableStream.push(null);
        readableStream.path = file.originalname;
        
        const result = await pinata.pinFileToIPFS(readableStream, {
          pinataMetadata: {
            name: `${directoryName || 'directory'}-${file.originalname}`,
            keyvalues: {
              uploadedBy: req.user?.walletAddress || 'anonymous',
              uploadDate: new Date().toISOString(),
              fileSize: file.size.toString(),
              mimeType: file.mimetype,
              directoryName: directoryName || 'uploaded-directory',
              fileIndex: index.toString()
            }
          },
          pinataOptions: {
            cidVersion: 1
          }
        });
        
        return {
          success: true,
          filename: file.originalname,
          cid: result.IpfsHash,
          url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (error) {
        console.error(`❌ Failed to upload ${file.originalname}:`, error);
        return {
          success: false,
          filename: file.originalname,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(r => r.success);
    
    // Create directory metadata
    const directoryMetadata = {
      name: directoryName || 'uploaded-directory',
      description: 'Directory containing multiple files',
      files: successfulUploads.map(upload => ({
        filename: upload.filename,
        cid: upload.cid,
        url: upload.url,
        size: upload.size,
        mimetype: upload.mimetype
      })),
      createdAt: new Date().toISOString(),
      totalFiles: successfulUploads.length
    };
    
    // Upload directory metadata
    const metadataResult = await pinata.pinJSONToIPFS(directoryMetadata, {
      pinataMetadata: {
        name: `${directoryName || 'directory'}-metadata.json`,
        keyvalues: {
          uploadedBy: req.user?.walletAddress || 'anonymous',
          uploadDate: new Date().toISOString(),
          directoryType: 'multi-file-upload',
          fileCount: successfulUploads.length.toString()
        }
      },
      pinataOptions: {
        cidVersion: 1
      }
    });
    
    console.log('✅ Directory upload successful:', { 
      metadataHash: metadataResult.IpfsHash,
      filesUploaded: successfulUploads.length
    });
    
    res.json({
      success: true,
      directoryCid: metadataResult.IpfsHash,
      directoryUrl: `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`,
      directoryName: directoryName || 'uploaded-directory',
      fileCount: successfulUploads.length,
      totalFiles: req.files.length,
      files: results
    });
  } catch (error) {
    console.error('❌ Directory upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload directory to IPFS',
      details: error.message 
    });
  }
});

// Get file from IPFS
router.get('/file/:cid/:filename?', async (req, res) => {
  try {
    const { cid, filename } = req.params;
    const url = filename 
      ? `https://gateway.pinata.cloud/ipfs/${cid}/${filename}`
      : `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    res.redirect(url);
  } catch (error) {
    console.error('❌ IPFS file access error:', error);
    res.status(500).json({ error: 'Failed to access IPFS file' });
  }
});

// Get pinned files list
router.get('/pinned-files', async (req, res) => {
  try {
    const pinata = getPinataClient();
    
    // Use pinList method for older SDK
    const result = await pinata.pinList({
      pageLimit: 100,
      pageOffset: 0,
      status: 'pinned'
    });
    
    res.json({
      success: true,
      count: result.count,
      files: result.rows
    });
  } catch (error) {
    console.error('❌ Failed to get pinned files:', error);
    res.status(500).json({ 
      error: 'Failed to get pinned files',
      details: error.message 
    });
  }
});

// Unpin file from IPFS
router.delete('/unpin/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const pinata = getPinataClient();
    
    // Use unpin method
    await pinata.unpin(cid);
    
    console.log('✅ File unpinned successfully:', cid);
    res.json({
      success: true,
      message: 'File unpinned successfully',
      cid: cid
    });
  } catch (error) {
    console.error('❌ Failed to unpin file:', error);
    res.status(500).json({ 
      error: 'Failed to unpin file',
      details: error.message 
    });
  }
});

// Test Pinata authentication
router.get('/test-auth', async (req, res) => {
  try {
    const pinata = getPinataClient();
    
    // Test authentication
    const result = await pinata.testAuthentication();
    
    res.json({
      success: true,
      message: 'Pinata authentication successful',
      result: result
    });
  } catch (error) {
    console.error('❌ Pinata authentication failed:', error);
    res.status(500).json({ 
      error: 'Pinata authentication failed',
      details: error.message 
    });
  }
});

export default router;