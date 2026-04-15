import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import React, { Key, useCallback } from 'react';
import { NumberInput } from '@heroui/number-input';
import { Certification, CertificationTopic } from '@/types';
import { Button } from '@heroui/button';

interface SectionsTableProps {
  selectedCertification: Certification | null;
  topicsList?: CertificationTopic[];
}

const TOPICS_TABLE_CONFIG = {
  columns: [
    { key: 'name', label: 'Topic Name' },
    { key: 'minQuestions', label: 'Min Questions' },
    { key: 'maxQuestions', label: 'Max Questions' },
    { key: 'actions', label: 'Actions' },
  ],
};

export function SectionsTable({ selectedCertification, topicsList }: SectionsTableProps) {
  const renderCell = useCallback((entry: any, columnKey: Key) => {
    const cellValue = entry[columnKey as keyof typeof entry];

    switch (columnKey) {
      case 'minQuestions':
      case 'maxQuestions':
        return cellValue.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 });
      case 'actions':
        return (
          <Button variant="flat" size="sm" color='danger'>
            Remove
          </Button>
        );
      default:
        return cellValue;
    }
  }, []);

  return (
    // <Table aria-label="Example table with dynamic content">
    //   <TableHeader columns={TOPICS_TABLE_CONFIG.columns}>
    //     {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
    //   </TableHeader>
    //   <TableBody items={selectedTopics.map((topic) => ({ key: topic }))} emptyContent={'No topics selected'}>
    //     {(item) => (
    //       <TableRow key={item.key}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
    //     )}
    //   </TableBody>
    // </Table>

    <Table isStriped aria-label="Example static collection table">
      <TableHeader columns={TOPICS_TABLE_CONFIG.columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody items={selectedCertification?.topics || topicsList || []} emptyContent={'No certification selected'}>
        {(topic) => (
            <TableRow key={topic.name}>{(columnKey) => <TableCell>{renderCell(topic, columnKey)}</TableCell>}</TableRow>
        )}
      </TableBody>
    </Table>
  );
}
