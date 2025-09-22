const Professor = require("../models/ProfessorModel");
const Group = require("../models/GroupModel");
const Student = require('../models/StudentModel')
const axios = require('axios');
const { getGithubAppInstallationAccessToken } = require('../utils/botMessage');

const getStudents = async (req, res) => {
    // Accept both param casings: groupID and groupId
    const groupId = req.params.groupID || req.params.groupId;
    try {
        if (!groupId) {
            return res.status(400).json({ error: 'Missing groupId parameter' });
        }

        const group = await Group.findById(groupId).populate('students');
        if (!group) {
            return res.status(404).json({ error: `Group with ID ${groupId} not found` });
        }

        // If students exist in DB, return them
        if (Array.isArray(group.students) && group.students.length > 0) {
            // Prevent caches from serving stale/empty responses
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.set('ETag', `${groupId}-${Date.now()}`);
            return res.status(200).json({ students: group.students });
        }

        // Fallback: derive students from GitHub repositories for this class
        try {
            const organizationGh = process.env.GITHUB_ORG;
            if (!organizationGh) {
                return res.status(200).json({ students: [] });
            }

            // Format class name to match repository naming convention (username-formattedClassName)
            const formattedClassName = group.groupName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const accessToken = await getGithubAppInstallationAccessToken();
            const reposResponse = await axios.get(
                `https://api.github.com/orgs/${organizationGh}/repos`,
                {
                    headers: {
                        Authorization: `token ${accessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                        'User-Agent': 'OSS-Management-Backend'
                    }
                }
            );

            const usernames = reposResponse.data
                .filter(repo => repo.name.endsWith(`-${formattedClassName}`))
                .map(repo => repo.name.replace(`-${formattedClassName}`, ''));

            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.set('ETag', `${groupId}-${Date.now()}`);
            return res.status(200).json({ students: usernames });
        } catch (fallbackError) {
            console.debug(`Fallback derive students error: ${fallbackError}`);
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.set('ETag', `${groupId}-${Date.now()}`);
            return res.status(200).json({ students: [] });
        }
    } catch (error) {
        console.debug(`Error in getStudents function: ${error}`);
        return res.status(500).json({ error });
    }
}

module.exports = {
    getStudents
}

