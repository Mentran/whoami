import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionResultHandler = (texts: string[]) => void;

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type BrowserSpeechRecognitionErrorEvent = Event & {
  error: string;
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  abort: () => void;
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function getSpeechErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") return "麦克风权限被拒绝";
  if (error === "no-speech") return "没有听到声音";
  if (error === "aborted") return "";
  if (error === "audio-capture") return "没有可用麦克风";
  if (error === "network") return "语音服务网络异常";
  return "语音识别失败";
}

function getMediaErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "麦克风权限被拒绝";
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") return "没有可用麦克风";
    if (error.name === "NotReadableError" || error.name === "TrackStartError") return "麦克风被其他应用占用";
  }

  return "麦克风启动失败";
}

export function useSpeechInput(onResult: SpeechRecognitionResultHandler) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const recognitionRunId = useRef(0);
  const [error, setError] = useState("");
  const [interimText, setInterimText] = useState("");
  const [listening, setListening] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [activated, setActivated] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt");
  const [session, setSession] = useState(0);
  const supported = useMemo(() => Boolean(getSpeechRecognition()), []);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    return () => {
      recognitionRunId.current += 1;
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        permissionStatus = status;
        setPermissionState(status.state);

        if (status.state === "denied") {
          setBlocked(true);
          setError("麦克风权限被拒绝");
        }

        status.onchange = () => {
          setPermissionState(status.state);

          if (status.state === "denied") {
            setBlocked(true);
            setError("麦克风权限被拒绝");
            return;
          }

          setBlocked(false);
          setError((current) => (current === "麦克风权限被拒绝" ? "" : current));
        };
      })
      .catch(() => undefined);

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRunId.current += 1;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;

    recognition?.stop();
    setInterimText("");
    setListening(false);
    setSession((current) => current + 1);
  }, []);

  const requestMicrophoneAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState("granted");
      setBlocked(false);
      setError("");
      return true;
    } catch (error) {
      const message = getMediaErrorMessage(error);
      setError(message);
      setBlocked(message === "麦克风权限被拒绝");
      if (message === "麦克风权限被拒绝") setPermissionState("denied");
      setListening(false);
      setSession((current) => current + 1);
      return false;
    }
  }, []);

  const start = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError("当前浏览器不支持语音输入");
      return;
    }

    setActivated(true);

    if (permissionState !== "granted") {
      const allowed = await requestMicrophoneAccess();
      if (!allowed) return;
    }

    const runId = recognitionRunId.current + 1;
    recognitionRunId.current = runId;

    const previousRecognition = recognitionRef.current;
    recognitionRef.current = null;
    previousRecognition?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognitionRef.current = recognition;

    setError("");
    setBlocked(false);
    setInterimText("");
    setListening(true);

    recognition.onresult = (event) => {
      if (runId !== recognitionRunId.current) return;

      let interim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript.trim() || "";

        if (result.isFinal) {
          const alternatives = Array.from({ length: result.length }, (_, alternativeIndex) => {
            return result[alternativeIndex]?.transcript.trim() || "";
          }).filter(Boolean);

          setInterimText("");
          onResultRef.current(alternatives.length ? alternatives : [transcript]);
          recognition.stop();
          return;
        }

        interim += transcript;
      }

      setInterimText(interim);
    };

    recognition.onstart = () => {
      if (runId !== recognitionRunId.current) return;
      setPermissionState("granted");
    };

    recognition.onerror = (event) => {
      if (runId !== recognitionRunId.current) return;

      const message = getSpeechErrorMessage(event.error);
      if (!message) return;

      setError(event.error === "no-speech" ? "" : message);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setBlocked(true);
        setPermissionState("denied");
      }
      if (event.error === "network") {
        setBlocked(true);
      }
      setListening(false);
      setSession((current) => current + 1);
    };

    recognition.onend = () => {
      if (runId !== recognitionRunId.current) return;

      setListening(false);
      setSession((current) => current + 1);
    };

    try {
      recognition.start();
    } catch {
      if (runId !== recognitionRunId.current) return;

      setError("语音识别启动失败");
      setListening(false);
      setSession((current) => current + 1);
    }
  }, [permissionState, requestMicrophoneAccess]);

  return useMemo(
    () => ({
      activated,
      canAutoRestart: supported && activated && !blocked && permissionState !== "denied",
      error,
      interimText,
      listening,
      permissionState,
      session,
      start,
      stop,
      supported,
    }),
    [activated, blocked, error, interimText, listening, permissionState, session, start, stop, supported],
  );
}
