import { catchAsync } from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/sendSuccess.js";
import { getGithubProfile, getGithubRepos } from "../integrations/github/githubService.js";

export const getProfile = catchAsync(async (req, res) => {
  const data = await getGithubProfile();
  sendSuccess(res, { message: "GitHub profile retrieved", data });
});

export const getRepos = catchAsync(async (req, res) => {
  const data = await getGithubRepos({ perPage: Number(req.query.limit) || 6 });
  sendSuccess(res, { message: "GitHub repositories retrieved", data, meta: { count: data.repos.length, cache: data.cache } });
});
