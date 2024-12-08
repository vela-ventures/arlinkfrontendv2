import { BAZAR, readHandler } from "@/lib/ao-vars";

export type AOProfileType = {
    id: string;
    walletAddress: string;
    displayName: string | null;
    username: string | null;
    bio: string | null;
    avatar: string | null;
    banner: string | null;
    version: string | null;
};

export interface ProfileHeaderType {
    displayName?: string;
    username?: string;
    avatar?: string;
    // Add other profile-related fields as needed
}

export type RegistryProfileType = {
    id: string;
    avatar: string | null;
    username: string;
    bio?: string;
};

export async function getProfileByWalletAddress({ address }: { address: string }): Promise<ProfileHeaderType> {
    // Implement the profile fetching logic here
    // This is just a placeholder implementation
    try {
        // Make your API call here
        const response = await fetch(`YOUR_API_ENDPOINT/profiles/${address}`);
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        return {};
    }
}

export async function getProfileById(args: { profileId: string }): Promise<ProfileHeaderType | null> {
    const emptyProfile: AOProfileType = {
        id: args.profileId,
        walletAddress: '',  // Changed from null to empty string
        displayName: null,
        username: null,
        bio: null,
        avatar: null,
        banner: null,
        version: null,
    };

    try {
        const fetchedProfile = await readHandler({
            processId: args.profileId,
            action: 'Info',
            data: null,
        });

        if (fetchedProfile) {
            return {
                id: args.profileId,
                walletAddress: fetchedProfile.Owner || '',  // Use empty string as fallback
                displayName: fetchedProfile.Profile.DisplayName || null,
                username: fetchedProfile.Profile.UserName || null,
                bio: fetchedProfile.Profile.Description || null,
                avatar: fetchedProfile.Profile.ProfileImage || null,
                banner: fetchedProfile.Profile.CoverImage || null,
                version: fetchedProfile.Profile.Version || null,
            };
        }
        return emptyProfile;
    } catch (e: any) {
        throw new Error(e);
    }
}