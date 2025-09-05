// Use dynamic imports for ES modules
async function postAcceptQ3Comments() {
  console.log('🚀 Starting to post /accept q3 comments for 18 users');
  console.log('🔐 Using GitHub App authentication');
  
  let successCount = 0;
  let errorCount = 0;
  
  try {
    // Dynamic imports
    const { Octokit } = await import('@octokit/rest');
    const { createAppAuth } = await import('@octokit/auth-app');
    
    // GitHub App credentials from environment
    const APP_ID = process.env.OSS_DOORWAY_APP_ID || "1430666";
    const PRIVATE_KEY = process.env.OSS_DOORWAY_PRIVATE_KEY || "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAtvVu4WWtRpyN/sVghuJzf62elHfIKRWeKavvWKPyJZ7eF5xZ\n2g+/y8l93uYcxZS98vSodwwiE5cGR0RKwPG4kuvmLgflxeYz724H9B/HkPAGlNCq\nU+6UNCT9TRsDaxhj24I1cHZKIZ84uSIbbcZV9EYPV+dbH5uk+UE1lCUpp3bVbVEd\nB+J55GaVwBoF+2I+TiTVFt+BDLtsrhL29K40sz5pK0vEPDoRjvXfgnlwWDTCp/gv\nyg0yOawCzrsppflYJLnRR0TsRSyldSSMOeNK736ka00M9GJrWmJ9ZELepKh47mID\nvaOdOLQOU2ztlC3m0J7rIvzmiPdhJGEMCzx0LQIDAQABAoIBAGbCWOGd4wGa4qHq\np/l6bNaUZFINKM3yh1/uYsMNae65WRI3zbuNRvMlm127LwPGNB2mTox2sxj/pRYY\nBEh0O2/BsQm/g81wK1FaInt58fO07G1e+Zukj3buI5rQBk57Z3Kdongk6CQUMp7A\nylkQoaxOQUXk+qg5GiKo/nfTm56jS3gv+jtTQ+nJPwmNcI37Y6JbkvHh7y2KxyL0\nwBrjaJO03MIhPgkhqNAA0XSifoKZ+YJ49K3kavNtsYrx5RHvEwE8uJa5XXwZFCNd\nHl5XvLw/vMmgH7Y5dOWs9aomdk+cjRdkIBXIXS0NlvS+/BdqzpvS+b2w1A6dPivB\nPdrPht0CgYEA441Sn7f4an7V8VBGf0HqIutCWhL84nVxid8UmXGWEobQ2mlQTOWj\n9BpnSCJNvuU/aeCiOmTK0N68Wr5ahogBECoZENI3PUzaVXsv/6zv3N4vqHaIQZLy\nEODl/LaFw4ZrwJvoClDu7kMcvkir3XXVJeq0uzjilAyiuytrZe3mqkcCgYEAzdTt\nBeVSPeAdY2WQiWRnt5YbAdhZUScWOIkZNBlAkpHRuYXiu9HbEo83pyHT+JNJuM7G\nMcV6g4Szy+sowU1b5wbSV0Mx1Ut4LgUWkSFvgqdrCGHCIqd8lgqrUfSWKaVu0xlA\nLStMrmvBTkl8ry3wqt/vwQk8T+qP/syrHB3eM+sCgYEA0QyUS4eIAM5lXjyRh3fW\n0h2v53BqQuICXNdE5XMknACe/wihbQPLjAZ1vB9HrYiOqYZlg5/1c84s3HDkWZO4\n5lDGll2JwhdIvh9eCVWnRxIYVnwO0a9eE4OJxpEocmibtWeF1XRlDR862NWKjvoh\nx6PIRfgMsFaraaiKEiptLyECgYEArA6EP3xtXfm8tzzMMH000drxIn62UscIpSO9\nZLaDKsIn/Rw05unKZd5AGD6H0W9Vnd2DAVHhUpUYMqqVe9htrVYfeABcZL7cbCOm\ntJStgRrvtqb5QDyfQVET2sNIzvFSDbY61kcup1K92PJG/qy5VC0zXjqZJvide9Gc\nazlwaBcCgYAyv7pvTk0PJEjgMNXgxRUO8aGVv3iAMZeOkcv8+C3ErhmCZ4nRS3Um\n/6RGGkEyPIYqDBrqlUIg39ngTnxrwUrMmg8YYnfnTHiSPzEjEz6LzKgzfSEi9Mn9\nN3OPGMblpSj869YI8Qeo8ObjVsBmTqW6dLSfPDDMp/mchx2gAPAQ5A==\n-----END RSA PRIVATE KEY-----\n";
    const INSTALLATION_ID = process.env.GITHUB_APP_INSTALLATION_ID || "72120768";
    
    // Users who completed Q2 and can now accept Q3
    const usersReadyForQ3 = [
      'alexaaguilar10-cs386-software-engineering',
      'EthanSNAU-cs386-software-engineering', 
      'loganb7869-cs386-software-engineering',
      'sjh559-cs386-software-engineering',
      'idh44-tech-cs386-software-engineering',
      'LatestStream-cs386-software-engineering',
      'akg358-cs386-software-engineering',
      'REB-95-cs386-software-engineering',
      'zpt4-cs386-software-engineering',
      'lgf33-cs386-software-engineering',
      'kayleeCromwell-cs386-software-engineering',
      'pieceoftoast42-cs386-software-engineering',
      'im576-cs386-software-engineering',
      'MunendraPC-cs386-software-engineering',
      'Aryan9832-cs386-software-engineering',
      'jmk658-cs386-software-engineering',
      'tg769-cs386-software-engineering',
      'Stecata2004Luca-cs386-software-engineering'
    ];
    
    async function createAuthenticatedOctokit() {
      const auth = createAppAuth({
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
        installationId: INSTALLATION_ID,
      });
      
      const { token } = await auth({ type: "installation" });
      
      return new Octokit({
        auth: token,
      });
    }
    
    const octokit = await createAuthenticatedOctokit();
    console.log('✅ GitHub App authentication successful');
    
    for (const repoName of usersReadyForQ3) {
      try {
        console.log(`📝 Processing ${repoName}...`);
        
        // Get all closed issues for this repository
        const issues = await octokit.rest.issues.listForRepo({
          owner: 'OSS-Doorway-Dev',
          repo: repoName,
          state: 'closed',
          per_page: 10, // Get recent closed issues
          sort: 'updated',
          direction: 'desc'
        });
        
        if (issues.data.length === 0) {
          console.log(`   ⚠️  No closed issues found for ${repoName}`);
          continue;
        }
        
        // Use the most recently closed issue
        const latestClosedIssue = issues.data[0];
        
        console.log(`   📌 Using issue #${latestClosedIssue.number}: "${latestClosedIssue.title}"`);
        
        // Post the /accept q3 comment
        await octokit.rest.issues.createComment({
          owner: 'OSS-Doorway-Dev',
          repo: repoName,
          issue_number: latestClosedIssue.number,
          body: '/accept q3'
        });
        
        console.log(`   ✅ Posted /accept q3 comment in ${repoName}#${latestClosedIssue.number}`);
        successCount++;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error posting to ${repoName}:`, error.message);
        errorCount++;
      }
    }
    
  } catch (authError) {
    console.error('❌ GitHub App authentication failed:', authError.message);
    return;
  }
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`   ✅ Successfully posted: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📋 Total processed: 18`);
  
  if (successCount > 0) {
    console.log('');
    console.log('🎉 The bot should now process these /accept q3 commands!');
    console.log('💡 Students will receive Q3 access automatically.');
  }
}

postAcceptQ3Comments();
