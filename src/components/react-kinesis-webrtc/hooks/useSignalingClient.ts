import { useEffect, useState } from "react";
import { Role, SignalingClient } from "amazon-kinesis-video-streams-webrtc";
import { SignalingClientConfigOptions } from "../ConfigOptions";

/**
 * @description Creates a signaling channel.
 **/
export function useSignalingClient(config: SignalingClientConfigOptions): {
  error: Error | undefined;
  signalingClient: SignalingClient | undefined;
} {
  const {
    channelARN,
    channelEndpoint,
    credentials: { accessKeyId = "", secretAccessKey = "", sessionToken = "" } = {},
    clientId,
    region,
    role,
    systemClockOffset,
  } = config;

  const [signalingClient, setSignalingClient] = useState<SignalingClient>();
  const [signalingClientError, setSignalingClientError] = useState<Error>();

  /** Create signaling client when endpoints are available. */
  useEffect(() => {
    if (!channelEndpoint) {
      return;
    }

    if (!clientId && role === Role.VIEWER) {
      return;
    }

    console.log('Vamos a crear un signaling client. Como esta la cosa?');

    if (signalingClient) {
      // Ya tenemos un signaling client, esperamos a que este cerrado para hacer uno nuevo
      // porque si no el close de useViewer nos lo pisa

      signalingClient.on("close", () => {
        setSignalingClient(
          new SignalingClient({
            channelARN,
            channelEndpoint,
            clientId,
            credentials: { accessKeyId, secretAccessKey, sessionToken },
            region,
            role,
            systemClockOffset,
          })
        );
      });
      setSignalingClient(undefined);
    } else {
      setSignalingClient(
        new SignalingClient({
          channelARN,
          channelEndpoint,
          clientId,
          credentials: { accessKeyId, secretAccessKey, sessionToken },
          region,
          role,
          systemClockOffset,
        })
      );
    }
  }, [
    accessKeyId,
    channelARN,
    channelEndpoint,
    clientId,
    region,
    role,
    secretAccessKey,
    sessionToken,
    systemClockOffset,
  ]);

  /** Handle signaling client lifecycle. */
  useEffect(() => {
    let isCancelled = false;

    function handleSignalingClientError(error: Error) {
      console.error(error);

      if (isCancelled) {
        return;
      }
      setSignalingClientError(error);
    }

    signalingClient?.on("error", handleSignalingClientError);

    return function cleanup() {
      isCancelled = true;

      signalingClient?.off("error", handleSignalingClientError);
    };
  }, [signalingClient]);

  return { error: signalingClientError, signalingClient };
}
