import { Controller, HttpStatus, HttpException } from '@nestjs/common'
import { BasicResponse } from '../dto/response'

@Controller()
export abstract class BaseController {
  protected getBasicSuccessJson() {
    return { isSuccess: true }
  }

  protected getSuccessJson(response: BasicResponse, value: any) {
    return {
      isSuccess: true,
      messageInfoTextArray: response.getMessageInfoTextArray(),
      value,
    }
  }

  protected getErrorJson(
    response: BasicResponse,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ): never {
    throw new HttpException(
      {
        isSuccess: false,
        messageErrorTextArray: response.getMessageErrorTextArray(),
      },
      statusCode,
    )
  }

  protected getErrorJsonFromMessage(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ): never {
    throw new HttpException(
      { isSuccess: false, messageErrorTextArray: [message] },
      statusCode,
    )
  }

  protected getErrorJsonFromMessages(
    messages: string[],
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ): never {
    throw new HttpException(
      { isSuccess: false, messageErrorTextArray: messages },
      statusCode,
    )
  }

  protected getPagedSearchGridJson(
    pageIndex: number,
    pageSize: number,
    rowJsonData: any[],
    totalCount: number,
  ) {
    return {
      data: rowJsonData,
      total: totalCount,
      pageIndex,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    }
  }

  protected populateAuditFieldsOnCreate(
    dto: {
      createdBy?: string
      createdDateTime?: Date
      lastModifiedBy?: string
      lastModifiedDateTime?: Date
    },
    username: string,
  ): void {
    const currentUtcTime = new Date()
    dto.createdBy = username
    dto.createdDateTime = currentUtcTime
    dto.lastModifiedBy = username
    dto.lastModifiedDateTime = currentUtcTime
  }

  protected populateAuditFieldsOnUpdate(
    dto: { lastModifiedBy?: string; lastModifiedDateTime?: Date },
    username: string,
  ): void {
    const currentUtcTime = new Date()
    dto.lastModifiedBy = username
    dto.lastModifiedDateTime = currentUtcTime
  }
}
