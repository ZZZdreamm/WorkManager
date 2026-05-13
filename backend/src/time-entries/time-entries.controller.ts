import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { ListTimeEntriesQuery } from './dto/list-time-entries.query';

@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly entries: TimeEntriesService) {}

  @Get()
  list(@Query() query: ListTimeEntriesQuery) {
    return this.entries.list(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTimeEntryDto) {
    return this.entries.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.entries.remove(id);
  }
}
