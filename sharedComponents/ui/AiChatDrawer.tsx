'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@heroui/drawer';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPaperPlane, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useAiChat } from '@/features/hooks/useAiChat.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { AiChatMessage } from '@/sharedComponents/ui/AiChatMessage';
import { AiChatPreviewCard } from '@/sharedComponents/ui/AiChatPreviewCard';
import { Certification } from '@/types';

interface AiChatDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function AiChatDrawer({ isOpen, onClose }: AiChatDrawerProps) {
  const { t } = useTranslation();
  const { messages, input, isStreaming, currentStreamContent, setInput, sendMessage, reset, saveCertificationFromChat } = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  type SaveState = {
    isSaving: boolean;
    result?: 'success' | 'error';
    errorMessage?: string;
  };

  const [saveStates, setSaveStates] = useState<Record<number, SaveState>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamContent]);

  const handleConfirm = useCallback(async (index: number, certification: Certification) => {
    setSaveStates(prev => ({ ...prev, [index]: { isSaving: true } }));
    const result = await saveCertificationFromChat(certification);
    if (result === 'success') {
      setSaveStates(prev => ({ ...prev, [index]: { isSaving: false, result: 'success' } }));
    } else if (result === 'duplicate') {
      setSaveStates(prev => ({ ...prev, [index]: { isSaving: false, result: 'error', errorMessage: t('chat.errorDuplicate', { key: certification.key }) } }));
    } else {
      setSaveStates(prev => ({ ...prev, [index]: { isSaving: false, result: 'error', errorMessage: t('chat.errorGeneric') } }));
    }
  }, [saveCertificationFromChat, t]);

  const handleNewChat = useCallback(() => {
    reset();
    setSaveStates({});
  }, [reset]);

  const handleAdjust = () => {
    inputRef.current?.focus();
  };

  const isBuildingCertification = isStreaming && currentStreamContent.includes('```certification-data');

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="xl" hideCloseButton>
      <DrawerContent>
        <DrawerHeader className="flex items-center justify-between border-b border-divider px-4 py-3">
          <span className="text-base font-semibold">{t('chat.title')}</span>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                size="sm"
                variant="flat"
                onPress={handleNewChat}
                isDisabled={isStreaming}
                className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 rounded-lg transition-colors text-xs font-semibold"
                startContent={<FontAwesomeIcon icon={faRotateRight} className="w-3 h-3" />}
              >
                {t('chat.newChat')}
              </Button>
            )}
            <Button isIconOnly size="sm" variant="light" onPress={onClose} aria-label="Close">
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
                <AiChatMessage role={message.role} content={message.content} isError={true} />
              ) : message.certificationData ? (
                <>
                  <AiChatMessage role={message.role} content={message.content} sources={message.sources} />
                  <AiChatPreviewCard
                    certification={message.certificationData}
                    onConfirm={() => handleConfirm(index, message.certificationData!)}
                    onAdjust={handleAdjust}
                    isSaving={saveStates[index]?.isSaving}
                    saveResult={saveStates[index]?.result}
                    errorMessage={saveStates[index]?.errorMessage}
                  />
                </>
              ) : (
                <AiChatMessage role={message.role} content={message.content} />
              )}
            </div>
          ))}

          {isStreaming && (
            <>
              <AiChatMessage role="assistant" content={currentStreamContent} isStreaming={true} />
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

        <DrawerFooter className="border-t border-divider px-4 py-3">
          <div className="flex gap-2 w-full items-center">
            <Input
              {...inputProperties.input}
              value={input}
              onValueChange={setInput}
              placeholder={t('chat.inputPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              ref={inputRef}
            />
            <Button
              isIconOnly
              isDisabled={isStreaming || !input.trim()}
              onPress={sendMessage}
              className="bg-primary text-primary-foreground rounded-lg shrink-0"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
