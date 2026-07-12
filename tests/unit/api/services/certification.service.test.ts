import { prismaMock } from '../__mocks__/prisma';
import { CertificationService } from '@/features/services/certification.service';

describe('CertificationService', () => {
  let service: CertificationService;

  beforeEach(() => {
    service = new CertificationService(prismaMock as any);
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
  });

  // Behaviour 1: validate() throws on missing label
  it('validate() throws when label is missing', () => {
    expect(() =>
      service.validate({ key: 'K', topics: [{ name: 'T', minQuestions: 1, maxQuestions: 5 }] }),
    ).toThrow('Certification label is required');
  });

  // Behaviour 2: validate() throws on empty topics array
  it('validate() throws when topics array is empty', () => {
    expect(() => service.validate({ label: 'L', key: 'K', topics: [] })).toThrow(
      'At least one topic is required',
    );
  });

  // Behaviour 3: validate() returns parsed object on happy path
  it('validate() returns trimmed label, key, and topics on valid input', () => {
    const result = service.validate({
      label: '  AWS SAA  ',
      key: '  aws-saa  ',
      provider: '  Amazon  ',
      topics: [{ name: 'IAM', minQuestions: 5, maxQuestions: 20 }],
    });

    expect(result.label).toBe('AWS SAA');
    expect(result.key).toBe('aws-saa');
    expect(result.provider).toBe('Amazon');
    expect(result.topics).toHaveLength(1);
    expect(result.topics[0].name).toBe('IAM');
    expect(result.topics[0].minQuestions).toBe(5);
    expect(result.topics[0].maxQuestions).toBe(20);
  });

  // Behaviour 4: save() calls $transaction and creates the cert
  it('save() calls $transaction and creates certification when no duplicate exists', async () => {
    const fakeCert = {
      id: 'cert-1',
      label: 'AWS SAA',
      key: 'aws-saa',
      provider: null,
      userId: 'user-1',
      topics: [{ id: 'topic-1', name: 'IAM', minQuestions: 5, maxQuestions: 20, certificationId: 'cert-1' }],
    };

    prismaMock.certification.findFirst.mockResolvedValue(null);
    prismaMock.certification.create.mockResolvedValue(fakeCert as any);

    const certification = {
      label: 'AWS SAA',
      key: 'aws-saa',
      provider: undefined,
      topics: [{ name: 'IAM', minQuestions: 5, maxQuestions: 20 }],
    };

    const result = await service.save(certification as any, 'user-1');

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(prismaMock.certification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          label: 'AWS SAA',
          key: 'aws-saa',
          userId: 'user-1',
        }),
        include: { topics: true },
      }),
    );
    expect(result).toEqual(fakeCert);
  });

  // Behaviour 5: save() throws 409 on duplicate key
  it('save() throws 409 when a certification with the same key already exists', async () => {
    prismaMock.certification.findFirst.mockResolvedValue({ id: 'existing-cert' } as any);

    const certification = {
      label: 'AWS SAA',
      key: 'aws-saa',
      provider: undefined,
      topics: [{ name: 'IAM', minQuestions: 5, maxQuestions: 20 }],
    };

    await expect(service.save(certification as any, 'user-1')).rejects.toMatchObject({
      status: 409,
    });
  });

  // Behaviour 6: addTopic() throws 409 when topic name already exists
  it('addTopic() throws 409 when topic name already exists in the certification', async () => {
    prismaMock.certification.findFirst.mockResolvedValue({
      id: 'cert-1',
      userId: 'user-1',
    } as any);
    prismaMock.certificationTopic.findUnique.mockResolvedValue({
      id: 'topic-1',
      name: 'IAM',
    } as any);

    await expect(service.addTopic('aws-saa', 'IAM', 5, 20, 'user-1')).rejects.toMatchObject({
      status: 409,
    });
  });

  // Behaviour 7: deleteTopic() throws 403 when userId doesn't match owner
  it('deleteTopic() throws 403 when the requesting user is not the certification owner', async () => {
    prismaMock.certificationTopic.findUnique.mockResolvedValue({
      id: 'topic-1',
      name: 'IAM',
      certification: { id: 'cert-1', userId: 'other-user' },
    } as any);

    await expect(service.deleteTopic('topic-1', 'current-user')).rejects.toMatchObject({
      status: 403,
    });
  });

  // Behaviour 8: deleteCertification() throws 404 when certification not found
  it('deleteCertification() throws 404 when no certification exists for the given key', async () => {
    prismaMock.certification.findFirst.mockResolvedValue(null);

    await expect(service.deleteCertification('aws-saa', 'user-1')).rejects.toMatchObject({
      status: 404,
    });

    expect(prismaMock.certification.delete).not.toHaveBeenCalled();
  });

  // Behaviour 9: deleteCertification() throws 404 when certification belongs to a different user
  it('deleteCertification() throws 404 when the certification does not belong to the requesting user', async () => {
    prismaMock.certification.findFirst.mockResolvedValue(null);

    await expect(service.deleteCertification('aws-saa', 'current-user')).rejects.toMatchObject({
      status: 404,
    });

    expect(prismaMock.certification.delete).not.toHaveBeenCalled();
  });

  // Behaviour 10: deleteCertification() deletes by userId+key on the happy path
  it('deleteCertification() calls prisma.certification.delete with userId+key when owner matches', async () => {
    prismaMock.certification.findFirst.mockResolvedValue({
      id: 'cert-1',
      key: 'aws-saa',
      userId: 'user-1',
    } as any);
    prismaMock.certification.delete.mockResolvedValue({ id: 'cert-1' } as any);

    await service.deleteCertification('aws-saa', 'user-1');

    expect(prismaMock.certification.delete).toHaveBeenCalledWith({
      where: { userId_key: { userId: 'user-1', key: 'aws-saa' } },
    });
  });

  // Behaviour 11: updateCertificationMeta() throws 409 when newKey conflicts
  it('updateCertificationMeta() throws 409 when newKey already belongs to a different certification', async () => {
    prismaMock.certification.findFirst
      .mockResolvedValueOnce({ id: 'cert-1', key: 'aws-saa', userId: 'user-1' } as any)
      .mockResolvedValueOnce({ id: 'cert-2', key: 'aws-saa-new' } as any);

    await expect(
      service.updateCertificationMeta('aws-saa', { newKey: 'aws-saa-new' }, 'user-1'),
    ).rejects.toMatchObject({ status: 409 });
  });
});
