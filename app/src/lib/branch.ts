import { Branch, BranchType } from '../models/branch'
import { UpstreamRemoteName } from './stores'
import {
  RepositoryWithGitHubRepository,
  getNonForkGitHubRepository,
  isRepositoryWithGitHubRepository,
  Repository,
} from '../models/repository'
import { IBranchesState } from './app-state'
import { getRemoteHEAD } from './git'

/**
 * Finds the default branch of the upstream repository of the passed repository.
 *
 * When the passed repository is not a fork or the fork is configured to use itself
 * as the ForkContributionTarget, then this method will return null. Otherwise it'll
 * return the default branch of the upstream repository.
 *
 * @param repository The repository to use.
 * @param branches all the branches in the local repo.
 */
export async function findDefaultUpstreamBranch(
  repository: RepositoryWithGitHubRepository,
  branches: ReadonlyArray<Branch>
): Promise<Branch | null> {
  const githubRepository = getNonForkGitHubRepository(repository)

  // This is a bit hacky... we checked if the result of calling
  // getNonForkGitHubRepository() is the same as the associated
  // gitHubRepository. When this happens, we know that either the
  // repository is not a fork or that it's a fork with
  // ForkContributionTarget=Self.
  //
  // TODO: Make this method return the default branch of the
  // origin repository instead of null in this scenario.
  if (githubRepository === repository.gitHubRepository) {
    return null
  }

  const remoteHEAD = await getRemoteHEAD(repository, UpstreamRemoteName)

  const foundBranch = branches.find(
    b =>
      b.type === BranchType.Remote &&
      b.name === `${UpstreamRemoteName}/${remoteHEAD}`
  )

  return foundBranch !== undefined ? foundBranch : null
}

/**
 *
 * @param repository The repository to use.
 * @param branchesState The branches state of the repository.
 * @returns The default branch of the user's contribution target, or null if it's not known.
 *
 * This method will return the fork's upstream default branch, if the user
 * is contributing to the parent repository.
 *
 * Otherwise, this method will return the default branch of the passed in repository.
 */
export async function findContributionTargetDefaultBranch(
  repository: Repository,
  { allBranches, defaultBranch }: IBranchesState
): Promise<Branch | null> {
  return isRepositoryWithGitHubRepository(repository)
    ? (await findDefaultUpstreamBranch(repository, allBranches)) ??
        defaultBranch
    : defaultBranch
}
