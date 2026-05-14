import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionResultHandler = (text: string) => void;

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
  if (error === "audio-capture") return "没有可用麦克风";
  if (error === "network") return "语音服务网络异常";
  return "语音识别失败";
}

export function useSpeechInput(onResult: SpeechRecognitionResultHandler) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);
  const [error, setError] = useState("");
  const [interimText, setInterimText] = useState("");
  const [listening, setListening] = useState(false);
  const supported = useMemo(() => Boolean(getSpeechRecognition()), []);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError("当前浏览器不支持语音输入");
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setError("");
    setInterimText("");
    setListening(true);

    recognition.onresult = (event) => {
      let interim = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript.trim() || "";

        if (result.isFinal) {
          setInterimText("");
          onResultRef.current(transcript);
          recognition.stop();
          return;
        }

        interim += transcript;
      }

      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      setError(getSpeechErrorMessage(event.error));
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      setError("语音识别启动失败");
      setListening(false);
    }
  }, []);

  return {
    error,
    interimText,
    listening,
    start,
    stop,
    supported,
  };
}

