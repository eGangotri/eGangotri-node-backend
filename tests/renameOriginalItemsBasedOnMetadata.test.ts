import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import { renameOriginalItemsBasedOnMetadata } from '../src/services/aiServices';

function createTempPdf(dir: string, name: string) {
  const fp = path.join(dir, name);
  fs.writeFileSync(fp, 'dummy pdf bytes');
  return fp;
}

test('renameOriginalItemsBasedOnMetadata: uses provided mock data structure (remapped to temp dir) and renames where metadata present', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-rename-test-ts-'));
  try {
    // All provided mock entries; limited to only fields used by the function
    const rawItems: Array<{ originalFilePath: string; extractedMetadata: string }> = [
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Guru Govindsingh Ji Jeevan Aur Darshan Edited By Narayan Bakth Sanmarg Prakashan Delhi.pdf',
        extractedMetadata: 'Guru Govind Singh Jeevan Aur Darshan Editor Narayan Bhakt Hindi Sikhism History Delhi 1969 - Sanmarg Prakashan',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Chochat Kawatiya By Indu Jain 1968.pdf',
        extractedMetadata: 'Chausath Kavitayen Poems by Indu Jain Edited by Lakshmichandra Jain Hindi Poetry Varanasi 1964 - Bharatiya Jnanpith',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Durga Saptshati Bashatika Tikkakar Pandit Gopaldutt Shastri 1964 Govardan Pustkalay Mathura.pdf',
        extractedMetadata: 'Durga Saptashati Bhasha Tika Commentator Pt Gyopaladatta Shastri Sanskrit and Hindi Hinduism Devotional Text Mathura 1952 - Govardhan Pustakalaya',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Vallabhadevas Commentry On The Sishupalavadham By J.D. Zadoo 1947.pdf',
        extractedMetadata: "A Critical Note On The Vallabhadeva's Commentary On The Shishupala Vadha By J D Zadoo Sanskrit Literature Criticism Srinagar 1947 - The Kashmir Series of Texts and Studie",
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Vidatta Ka Viddan By Ram Chand.pdf',
        extractedMetadata: '',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Tolstoy Granthavali Translated By Sh. Ghayan Chand Jain 1945.pdf',
        extractedMetadata: '',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Book Of Commentary and Explanation Of Various Sanskrit Terms and Concepts(Shivasutravimarshina).pdf',
        extractedMetadata: 'Shiva Sutra Vimarshini Sanskrit Kashmir Shaivism Missing Pages Unknown - Kshemaraja',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Bharatya Sahkarita Andolan By Shankarsahay Saxena.pdf',
        extractedMetadata: 'Bharatiya Sahakarita Andolan By Shankar Sahay Saksena Hindi Cooperation Economics Bareilly 1935 - S S Saksena',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Sri Ramayan Mahakaway(Second Part) Edited By Sripad Damodhar Saatvalanker (First Pdf)-merged.pdf',
        extractedMetadata: '',
      },
      {
        originalFilePath: 'F:\\Treasures86\\_data\\iks\\sps\\Swath Aur Yoga By Vidhyabhaskar Sukul.pdf',
        extractedMetadata: 'Svasthya Aur Yogasan By Vidyabhaskar Sukul Hindi Yoga Health Prayag - Sahitya Niketan',
      },
      {
        originalFilePath: 'F:\\x.pdf',
        extractedMetadata: 'b.pdf',
      },
      {
        originalFilePath: 'F:\\y.pdf',
        extractedMetadata: 'b.pdf',
      },
      {
        originalFilePath: 'F:\\c.pdf',
        extractedMetadata: 'x.pdf',
      },
    ];

    // Remap to temp dir and create files. Also truncate metadata to 40 chars to avoid Windows path length issues in tests.
    const items = rawItems.map((it) => {
      const base = path.basename(it.originalFilePath);
      const tempPath = createTempPdf(tmpRoot, base);
      const safeMeta = (it.extractedMetadata || '').slice(0, 40).trim();
      // Only include the fields the function actually uses
      return {
        originalFilePath: tempPath,
        extractedMetadata: it.extractedMetadata ? safeMeta : it.extractedMetadata,
      } as { originalFilePath: string; extractedMetadata?: string };
    });

    const expectedSuccesses = items.filter((x) => (x.extractedMetadata || '').trim().length > 0).length;
    const expectedFailures = items.length - expectedSuccesses;

    const res = await renameOriginalItemsBasedOnMetadata(items as unknown as any[]);
    
    assert.equal(res.successCount, expectedSuccesses);
    assert.equal(res.failureCount, expectedFailures);
    assert.equal(Array.isArray(res.errors), true);
    assert.equal(res.errors.length, expectedFailures);

    // Spot check: second item should be renamed with current suffixing quirk to _29
    const secondSafeName = (rawItems[1].extractedMetadata as string).slice(0, 40).trim();
    const expectedRenamed = path.join(tmpRoot, `${secondSafeName}.pdf`);
    assert.equal(fs.existsSync(expectedRenamed), true, 'Expected renamed file does not exist');
  } finally {
    try {
      fs.readdirSync(tmpRoot).forEach((f) => {
        try { fs.unlinkSync(path.join(tmpRoot, f)); } catch {}
      });
      fs.rmdirSync(tmpRoot);
    } catch {}
  }
});


/**
 * node -r ts-node/register --test tests/renameOriginalItemsBasedOnMetadata.test.ts
 */