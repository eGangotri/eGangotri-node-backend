import * as os from 'os';

/**
 * Gets the server's non-internal IPv4 address
 * @returns Object containing server IP and hostname
 */
export function getServerNetworkInfo(): { serverIp: string; hostname: string } {
    try {
        // Get all network interfaces
        const networkInterfaces = os.networkInterfaces();
        let serverIp = 'UnknownIP';
        
        // Loop through all interfaces to find a non-internal IPv4 address
        for (const interfaceName in networkInterfaces) {
            const interfaces = networkInterfaces[interfaceName];
            if (interfaces) {
                // Find IPv4 non-internal addresses
                for (const iface of interfaces) {
                    // Handle different versions of Node.js type definitions
                    if (iface.family === 'IPv4' && !iface.internal) {
                        serverIp = iface.address;
                        break;
                    }
                }
            }
            if (serverIp !== 'UnknownIP') break;
        }
        
        return {
            serverIp,
            hostname: os.hostname()
        };
    } catch (err) {
        console.error("Error getting server network info", err);
        return {
            serverIp: 'UnknownIP',
            hostname: 'UnknownHost'
        };
    }
}

