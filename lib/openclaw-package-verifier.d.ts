/**
 * OpenClaw Package Verifier
 * Uses Claude to verify 3rd party packages are safe before installation
 */
export interface PackageVerification {
    packageName: string;
    version?: string;
    safe: boolean;
    safetyScore: number;
    risks: string[];
    alternatives: string[];
    recommendation: 'safe' | 'caution' | 'reject';
    reasoning: string;
    whatItDoes: string;
}
export interface VerificationResult {
    allSafe: boolean;
    packages: PackageVerification[];
    summary: string;
}
export declare function verifyPackage(packageName: string, purpose: string, apiKey: string): Promise<PackageVerification>;
export declare function verifyPackages(packages: Array<{
    name: string;
    purpose: string;
}>, apiKey: string): Promise<VerificationResult>;
