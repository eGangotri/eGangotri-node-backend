/**
 * Download a Document file in PDF format
 * 
 * must run from Adm-privilege command prompt
   gcloud auth application-default login

   NON-FUNCTIONAL
 * @param{string} fileId file ID
 * @return{obj} file status
 * */
async function exportPdf(fileId: string) {
  const { GoogleAuth } = require('google-auth-library');
  const { google } = require('googleapis');

  // Get credentials and build service
  // TODO (developer) - Use appropriate auth mechanism for your app
  //Enable Cloud DNS API
  //https://console.cloud.google.com/apis/api/dns.googleapis.com/metrics?project=hardy-ivy-388117
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/drive',
  });

  const client = await auth.getClient();
  const projectId = await auth.getProjectId();
  const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`;
  const res = await client.request({ url });
  console.log(res.data);
  const service = google.drive({ version: 'v3', auth });
  console.log(`..1`)
  try {
    const result = await service.files.export({
      fileId: fileId,
      mimeType: 'application/pdf',
    },
      { responseType: "stream" },
    );
    console.log(`..2`)

    console.log(result.status);
    return result;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}

exportPdf('1IM5CN3B5w-5xjjRJyf5xY9fGBc9a-tpA')
  //exportPdf('1D2tTeiwtnRyYuf1r5bfTaQaLN5gfws9i')