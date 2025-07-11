// Script pour extraire le bytecode de votre contrat
// Placez ce script dans votre dossier scripts/ de Hardhat

const fs = require('fs');
const path = require('path');

async function main() {
  // Nom de votre contrat
  const contractName = "Certificate"; // Remplacez par le nom de votre contrat
  
  try {
    // Chemin vers les artifacts
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
    
    // Lire le fichier d'artifact
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Extraire le bytecode
    const bytecode = artifact.bytecode;
    const abi = artifact.abi;
    
    console.log('=== BYTECODE ===');
    console.log(bytecode);
    console.log('\n=== ABI ===');
    console.log(JSON.stringify(abi, null, 2));
    
    // Optionnel : sauvegarder dans un fichier
    const outputData = {
      bytecode: bytecode,
      abi: abi,
      contractName: contractName
    };
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'contract-data.json'),
      JSON.stringify(outputData, null, 2)
    );
    
    console.log('\n✅ Bytecode et ABI sauvegardés dans contract-data.json');
    
  } catch (error) {
    console.error('Erreur lors de l\'extraction du bytecode:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });