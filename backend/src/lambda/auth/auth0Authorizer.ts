import {CustomAuthorizerEvent, CustomAuthorizerResult} from 'aws-lambda'
import 'source-map-support/register'

import {verify, decode} from 'jsonwebtoken'
import {createLogger} from '../../utils/logger'
import Axios from 'axios'
import {Jwt} from '../../auth/Jwt'
import {JwtPayload} from '../../auth/JwtPayload'

const logger = createLogger('auth')


const jwksUrl = 'https://dev-kko1f-vc.us.auth0.com/.well-known/jwks.json'

export const handler = async (
    event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
    logger.info('Authorizing a user', event.authorizationToken)
    try {
        const jwtToken = await verifyToken(event.authorizationToken)
        logger.info('User was authorized', jwtToken)

        return {
            principalId: jwtToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*'
                    }
                ]
            }
        }
    } catch (e) {
        logger.error('User not authorized', {error: e.message})

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*'
                    }
                ]
            }
        }
    }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
    try {
        const token = getToken(authHeader)
        const jwt: Jwt = decode(token, {complete: true}) as Jwt

        // You should implement it similarly to how it was implemented for the exercise for the lesson 5
        // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
        let key = await getSigningKey(jwksUrl, jwt.header.kid)

        return verify(
            token,           // Token from an HTTP header to validate
            key.publicKey,            // A certificate copied from Auth0 website
            {algorithms: ['RS256']} // We need to specify that we use the RS256 algorithm
        ) as JwtPayload
    } catch (err) {
        logger.error('Fail to authenticate', err)
    }
}

function getToken(authHeader: string): string {
    if (!authHeader) throw new Error('No authentication header')

    if (!authHeader.toLowerCase().startsWith('bearer '))
        throw new Error('Invalid authentication header')

    const split = authHeader.split(' ')
    const token = split[1]

    return token
}

const getSigningKey = async (jwkurl: string, kid: string) => {
    let res = await Axios.get(jwkurl, {
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Credentials': true,
        },
    });

    let keys = res.data.keys;

    // since the keys is an array its possible to have many keys in case of cycling.
    const signingKeys = keys.filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
        && key.kty === 'RSA' // We are only supporting RSA
        && key.kid           // The `kid` must be present to be useful for later
        && key.x5c && key.x5c.length // Has useful public keys (we aren't using n or e)
    ).map(key => {
        return {kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0])};
    });

    const signingKey = signingKeys.find(key => key.kid === kid);
    if (!signingKey) {
        logger.error("No signing keys found")
        throw new Error('Invalid signing keys')
    }

    logger.info("Signing keys created successfully ", signingKey)
    return signingKey;
};

function certToPEM(cert: string) {
    cert = cert.match(/.{1,64}/g).join('\n');
    cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
    return cert;
}
