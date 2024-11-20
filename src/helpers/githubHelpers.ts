import axios from "axios";
import * as extract from "extract-zip";
import * as fs from "fs-extra";
// Helper function to download GitHub repository as zip
export async function downloadRepositoryZip(
    username: string,
    repo: string,
    branch: string,
    accessToken: string
  ): Promise<string> {
    try {
      console.log(`Downloading repository ${repo} from ${username} on branch ${branch}`);
      const response = await axios({
        method: "get",
        url: `https://api.github.com/repos/${username}/${repo}/zipball/${branch}`,
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      console.log("Repository downloaded!");
      return response.request.res.responseUrl;
    } catch (error) {
      console.error("Error downloading repository:", error);
      throw error;
    }
  }
  
  
  // Helper function to save and extract repository zip
  export async function saveAndExtractRepository(
      downloadUrl: string, 
      userApp: string, 
      target: string
    ): Promise<string[]> {
      const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      
      await fs.writeFile(target, response.data);
      console.log("File written!");
      
      await extract.default(target, { dir: userApp });
      await fs.unlink(target);
      console.log("Deleted bootstrap.zip");
      
      return fs.readdir(userApp);
    }