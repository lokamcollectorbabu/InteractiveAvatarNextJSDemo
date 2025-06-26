import StreamingAvatar, {
  ConnectionQuality,
  StartAvatarRequest,
  StreamingEvents,
} from "@heygen/streaming-avatar";
import { useCallback } from "react";

import {
  StreamingAvatarSessionState,
  useStreamingAvatarContext,
} from "./context";
import { useVoiceChat } from "./useVoiceChat";
import { useMessageHistory } from "./useMessageHistory";

export const useStreamingAvatarSession = () => {
  const {
    avatarRef,
    basePath,
    sessionState,
    setSessionState,
    stream,
    setStream,
    setIsListening,
    setIsUserTalking,
    setIsAvatarTalking,
    setConnectionQuality,
    handleUserTalkingMessage,
    handleStreamingTalkingMessage,
    handleEndMessage,
    clearMessages,
  } = useStreamingAvatarContext();
  const { stopVoiceChat } = useVoiceChat();

  useMessageHistory();

  const init = useCallback(
    (token: string) => {
      avatarRef.current = new StreamingAvatar({
        token,
        basePath: basePath,
      });

      return avatarRef.current;
    },
    [basePath, avatarRef],
  );

  const handleStream = useCallback(
    ({ detail }: { detail: MediaStream }) => {
      setStream(detail);
      setSessionState(StreamingAvatarSessionState.CONNECTED);
    },
    [setSessionState, setStream],
  );

  const handleConnectionQualityChanged = useCallback(
    ({ detail }: { detail: ConnectionQuality }) => {
      setConnectionQuality(detail);
    },
    [setConnectionQuality],
  );

  const handleUserStart = useCallback(() => {
    setIsUserTalking(true);
  }, [setIsUserTalking]);

  const handleUserStop = useCallback(() => {
    setIsUserTalking(false);
  }, [setIsUserTalking]);

  const handleAvatarStartTalking = useCallback(() => {
    setIsAvatarTalking(true);
  }, [setIsAvatarTalking]);

  const handleAvatarStopTalking = useCallback(() => {
    setIsAvatarTalking(false);
  }, [setIsAvatarTalking]);

  const stop = useCallback(async () => {
    // Remove all event listeners explicitly except error handler
    if (avatarRef.current) {
      avatarRef.current.off(StreamingEvents.STREAM_READY, handleStream);
      avatarRef.current.off(StreamingEvents.STREAM_DISCONNECTED, stop);
      avatarRef.current.off(
        StreamingEvents.CONNECTION_QUALITY_CHANGED,
        handleConnectionQualityChanged,
      );
      avatarRef.current.off(StreamingEvents.USER_START, handleUserStart);
      avatarRef.current.off(StreamingEvents.USER_STOP, handleUserStop);
      avatarRef.current.off(
        StreamingEvents.AVATAR_START_TALKING,
        handleAvatarStartTalking,
      );
      avatarRef.current.off(
        StreamingEvents.AVATAR_STOP_TALKING,
        handleAvatarStopTalking,
      );
      avatarRef.current.off(
        StreamingEvents.USER_TALKING_MESSAGE,
        handleUserTalkingMessage,
      );
      avatarRef.current.off(
        StreamingEvents.AVATAR_TALKING_MESSAGE,
        handleStreamingTalkingMessage,
      );
      avatarRef.current.off(StreamingEvents.USER_END_MESSAGE, handleEndMessage);
      avatarRef.current.off(
        StreamingEvents.AVATAR_END_MESSAGE,
        handleEndMessage,
      );
    }

    clearMessages();
    stopVoiceChat();
    setIsListening(false);
    setIsUserTalking(false);
    setIsAvatarTalking(false);
    setStream(null);

    // Stop avatar and then remove error handler to catch any shutdown errors
    await avatarRef.current?.stopAvatar();

    // Remove error handler after stopAvatar completes
    if (avatarRef.current) {
      // Create a dummy handler for the off method
      const dummyHandler = () => {};

      avatarRef.current.off("error", dummyHandler);
    }

    setSessionState(StreamingAvatarSessionState.INACTIVE);
  }, [
    handleStream,
    handleConnectionQualityChanged,
    handleUserStart,
    handleUserStop,
    handleAvatarStartTalking,
    handleAvatarStopTalking,
    setSessionState,
    setStream,
    avatarRef,
    setIsListening,
    stopVoiceChat,
    clearMessages,
    setIsUserTalking,
    setIsAvatarTalking,
    handleUserTalkingMessage,
    handleStreamingTalkingMessage,
    handleEndMessage,
  ]);

  const start = useCallback(
    async (config: StartAvatarRequest, token?: string) => {
      if (sessionState !== StreamingAvatarSessionState.INACTIVE) {
        throw new Error("There is already an active session");
      }

      if (!avatarRef.current) {
        if (!token) {
          throw new Error("Token is required");
        }
        init(token);
      }

      if (!avatarRef.current) {
        throw new Error("Avatar is not initialized");
      }

      setSessionState(StreamingAvatarSessionState.CONNECTING);
      avatarRef.current.on(StreamingEvents.STREAM_READY, handleStream);
      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, stop);
      avatarRef.current.on(
        StreamingEvents.CONNECTION_QUALITY_CHANGED,
        handleConnectionQualityChanged,
      );
      avatarRef.current.on(StreamingEvents.USER_START, handleUserStart);
      avatarRef.current.on(StreamingEvents.USER_STOP, handleUserStop);
      avatarRef.current.on(
        StreamingEvents.AVATAR_START_TALKING,
        handleAvatarStartTalking,
      );
      avatarRef.current.on(
        StreamingEvents.AVATAR_STOP_TALKING,
        handleAvatarStopTalking,
      );
      avatarRef.current.on(
        StreamingEvents.USER_TALKING_MESSAGE,
        handleUserTalkingMessage,
      );
      avatarRef.current.on(
        StreamingEvents.AVATAR_TALKING_MESSAGE,
        handleStreamingTalkingMessage,
      );
      avatarRef.current.on(StreamingEvents.USER_END_MESSAGE, handleEndMessage);
      avatarRef.current.on(
        StreamingEvents.AVATAR_END_MESSAGE,
        handleEndMessage,
      );

      await avatarRef.current.createStartAvatar(config);

      return avatarRef.current;
    },
    [
      init,
      handleStream,
      handleConnectionQualityChanged,
      handleUserStart,
      handleUserStop,
      handleAvatarStartTalking,
      handleAvatarStopTalking,
      stop,
      setSessionState,
      avatarRef,
      sessionState,
      handleUserTalkingMessage,
      handleStreamingTalkingMessage,
      handleEndMessage,
    ],
  );

  const interrupt = useCallback(async () => {
    if (!avatarRef.current) {
      throw new Error("Avatar is not initialized");
    }
    await avatarRef.current.interrupt();
  }, [avatarRef]);

  return {
    avatarRef,
    sessionState,
    stream,
    initAvatar: init,
    startAvatar: start,
    stopAvatar: stop,
    interruptAvatar: interrupt,
  };
};