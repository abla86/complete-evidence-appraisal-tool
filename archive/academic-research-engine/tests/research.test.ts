import test from "node:test";
import assert from "node:assert/strict";

import {
  addDocument,
  searchDocuments,
  createClaim
} from "../src/services/workspace.js";

import {
  apa7,
  vancouver
} from "../src/services/citations.js";

test(
  "document ingestion and source search",
  () => {

    const document =
      addDocument({
        fileName:
          "research.txt",
        mimeType:
          "text/plain",
        sourceType:
          "txt",
        text:
          "Person-centred care may improve experiences in dementia care."
      });

    const results =
      searchDocuments(
        "person-centred",
        [document.id]
      );

    assert.ok(
      results.length > 0
    );

    assert.equal(
      results[0].documentId,
      document.id
    );
  }
);

test(
  "APA 7 citation",
  () => {

    const result =
      apa7({
        title:
          "Example study",
        authors:
          ["Smith, J."],
        year:
          2025,
        journal:
          "Example Journal",
        volume:
          "10",
        issue:
          "2",
        pages:
          "10-20",
        doi:
          "10.1000/example"
      });

    assert.match(
      result,
      /Smith/
    );

    assert.match(
      result,
      /10\.1000\/example/
    );
  }
);

test(
  "Vancouver citation",
  () => {

    const result =
      vancouver({
        title:
          "Example study",
        authors:
          ["Smith J"],
        year:
          2025,
        journal:
          "Example Journal"
      });

    assert.match(
      result,
      /Smith J/
    );
  }
);

test(
  "evidence claim",
  () => {

    const claim =
      createClaim({
        claim:
          "The study reports improved experience.",
        documentId:
          "document-test",
        location:
          "Page 4",
        quote:
          "Example evidence",
        status:
          "candidate"
      });

    assert.equal(
      claim.status,
      "candidate"
    );
  }
);


test(
  "document search returns only documents matching every query term",
  () => {
    const first = addDocument({
      fileName: "first.txt",
      mimeType: "text/plain",
      sourceType: "txt",
      text: "Person-centred care improves dementia care."
    });
    const second = addDocument({
      fileName: "second.txt",
      mimeType: "text/plain",
      sourceType: "txt",
      text: "Person-centred care is discussed here."
    });

    const results = searchDocuments("person-centred dementia", [first.id, second.id]);

    assert.ok(results.length > 0);
    assert.ok(results.every(result => result.documentId === first.id));
  }
);

test(
  "empty document text is rejected",
  () => {
    assert.throws(
      () => addDocument({
        fileName: "empty.txt",
        mimeType: "text/plain",
        sourceType: "txt",
        text: "   "
      }),
      /Document text cannot be empty/
    );
  }
);
