'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@heroui/drawer';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPaperPlane, faRotateRight, faPaperclip, faFilePdf } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAiChat } from '@/features/hooks/useAiChat.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { AiChatMessage } from '@/shared/components/ui/AiChatMessage';
import { AiChatPreviewCard } from '@/shared/components/ui/AiChatPreviewCard';
import { AiChatExamDraftCard } from '@/shared/components/ui/AiChatExamDraftCard';
import { Certification } from '@/shared/types';

interface AiChatDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function AiChatDrawer({ isOpen, onClose }: AiChatDrawerProps) {
  const { t } = useTranslation();
  const {
    messages,
    input,
    isStreaming,
    currentStreamContent,
    pendingFile,
    setInput,
    sendMessage,
    reset,
    saveCertificationFromChat,
    handleEditalUpload,
    cancelPendingFile,
    injectAssistantMessage,
  } = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type SaveState = {
    isSaving: boolean;
    result?: 'success' | 'error';
    errorMessage?: string;
  };

  const [saveStates, setSaveStates] = useState<Record<number, SaveState>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamContent]);

  const handleConfirm = useCallback(
    async (index: number, certification: Certification) => {
      setSaveStates((prev) => ({ ...prev, [index]: { isSaving: true } }));
      const result = await saveCertificationFromChat(certification);

      if (result === 'success') {
        setSaveStates((prev) => ({ ...prev, [index]: { isSaving: false, result: 'success' } }));
        injectAssistantMessage(t('chat.followUpQuestion'));
      } else if (result === 'duplicate') {
        setSaveStates((prev) => ({
          ...prev,
          [index]: {
            isSaving: false,
            result: 'error',
            errorMessage: t('chat.errorDuplicate', { key: certification.key }),
          },
        }));
      } else {
        setSaveStates((prev) => ({
          ...prev,
          [index]: { isSaving: false, result: 'error', errorMessage: t('chat.errorGeneric') },
        }));
      }
    },
    [saveCertificationFromChat, injectAssistantMessage, t]
  );

  const handleNewChat = useCallback(() => {
    reset();
    setSaveStates({});
  }, [reset]);

  const handleAdjust = () => {
    inputRef.current?.focus();
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) return;
      e.target.value = '';
      handleEditalUpload(file);
    },
    [handleEditalUpload]
  );

  const isBuildingCertification = isStreaming && currentStreamContent.includes('```certification-data');

  return (
    <Drawer hideCloseButton isOpen={isOpen} placement="right" size="xl" onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between border-b border-divider px-4 py-3">
          <span className="text-base font-semibold">{t('chat.title')}</span>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 rounded-lg transition-colors text-xs font-semibold"
                isDisabled={isStreaming}
                size="sm"
                startContent={<FontAwesomeIcon className="w-3 h-3" icon={faRotateRight} />}
                variant="flat"
                onPress={handleNewChat}
              >
                {t('chat.newChat')}
              </Button>
            )}
            <Button isIconOnly aria-label="Close" size="sm" variant="light" onPress={onClose}>
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-3 px-4 py-4 overflow-y-auto">
          {messages.length === 0 && !isStreaming ? (
            <div className="bg-content1 border border-default-200 rounded-xl p-4">
              <p className="text-sm text-default-500">{t('chat.welcome')}</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-default-400">{t('chat.examples')}</p>
                <p className="text-xs text-default-400 italic">{t('chat.example1')}</p>
                <p className="text-xs text-default-400 italic">{t('chat.example2')}</p>
              </div>
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div key={index}>
              {message.isError ? (
                <AiChatMessage content={message.content} isError={true} role={message.role} />
              ) : message.examDraft ? (
                <AiChatExamDraftCard
                  publicExam={message.examDraft}
                  onExamSaved={() => injectAssistantMessage(t('chat.followUpQuestion'))}
                />
              ) : message.certificationData ? (
                <>
                  <AiChatMessage content={message.content} role={message.role} sources={message.sources} />
                  <AiChatPreviewCard
                    certification={message.certificationData}
                    errorMessage={saveStates[index]?.errorMessage}
                    isSaving={saveStates[index]?.isSaving}
                    saveResult={saveStates[index]?.result}
                    onAdjust={handleAdjust}
                    onConfirm={() => handleConfirm(index, message.certificationData!)}
                  />
                </>
              ) : (
                <AiChatMessage attachmentName={message.attachmentName} content={message.content} role={message.role} />
              )}
            </div>
          ))}

          {isStreaming && (
            <>
              {/* eslint-disable-next-line jsx-a11y/aria-role */}
              <AiChatMessage content={currentStreamContent} isStreaming={true} role="assistant" />
              {isBuildingCertification && (
                <div className="bg-content1 border-2 border-primary/30 rounded-xl p-4 mt-2 animate-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-3 bg-default-200 rounded w-36" />
                    <div className="h-5 bg-default-200 rounded-full w-20" />
                  </div>
                  <div className="h-4 bg-default-200 rounded w-48 mb-4" />
                  <div className="space-y-2 mb-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-3 bg-default-200 rounded flex-1" />
                        <div className="h-3 bg-default-200 rounded w-8" />
                        <div className="h-3 bg-default-200 rounded w-8" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-default-200 rounded-lg flex-1" />
                    <div className="h-8 bg-default-200 rounded-lg flex-1" />
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </DrawerBody>

        <DrawerFooter className="border-t border-divider px-4 py-3 flex-col gap-0">
          {pendingFile && (
            <div className="flex items-center gap-2 px-1 py-2 w-full mb-1">
              <FontAwesomeIcon className="text-danger text-sm shrink-0" icon={faFilePdf} />
              <button
                className="text-xs text-foreground truncate max-w-[200px] hover:underline text-left"
                onClick={() => window.open(URL.createObjectURL(pendingFile), '_blank')}
              >
                {pendingFile.name}
              </button>
              <button
                aria-label={t('chat.removeAttachment')}
                className="ml-auto text-default-400 hover:text-foreground"
                onClick={cancelPendingFile}
              >
                <FontAwesomeIcon className="text-xs" icon={faXmark} />
              </button>
            </div>
          )}
          <div className="flex gap-2 w-full items-center">
            <input
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              type="file"
              onChange={handleFileChange}
            />
            <Button
              isIconOnly
              aria-label={t('chat.uploadEdital')}
              className="shrink-0 text-default-400 hover:text-foreground"
              isDisabled={isStreaming}
              size="sm"
              variant="light"
              onPress={() => fileInputRef.current?.click()}
            >
              <FontAwesomeIcon icon={faPaperclip} />
            </Button>
            <Input
              {...inputProperties.input}
              ref={inputRef}
              placeholder={pendingFile ? t('chat.rolePlaceholder') : t('chat.inputPlaceholder')}
              value={input}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onValueChange={setInput}
            />
            <Button
              isIconOnly
              className="bg-primary text-primary-foreground rounded-lg shrink-0"
              isDisabled={isStreaming || (!input.trim() && !pendingFile)}
              onPress={sendMessage}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
