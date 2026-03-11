import { MessageType } from '../../enums'
import { Message } from '../../models/message.model'

export class BasicResponse {
  private _messages: Message[] = []

  get messages(): Message[] {
    return this._messages
  }

  isError(): boolean {
    return this._messages.some((msg) => msg.type === MessageType.Error)
  }

  isContainInfo(): boolean {
    return this._messages.some((msg) => msg.type === MessageType.Info)
  }

  getMessageTextArray(): string[] {
    return this._messages.map((msg) => msg.messageText)
  }

  getMessageErrorTextArray(): string[] {
    return this._messages
      .filter((msg) => msg.type === MessageType.Error)
      .map((msg) => msg.messageText)
  }

  getMessageInfoTextArray(): string[] {
    return this._messages
      .filter((msg) => msg.type === MessageType.Info)
      .map((msg) => msg.messageText)
  }

  getErrorMessage(): string {
    return this._messages.map((msg) => msg.messageText).join('\n')
  }

  addErrorMessage(errorMessage: string): void {
    this._messages.push({ messageText: errorMessage, type: MessageType.Error })
  }

  addInfoMessage(infoMessage: string): void {
    this._messages.push({ messageText: infoMessage, type: MessageType.Info })
  }

  addWarningMessage(warningMessage: string): void {
    this._messages.push({ messageText: warningMessage, type: MessageType.Warning })
  }
}
