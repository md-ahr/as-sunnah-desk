CREATE VIRTUAL TABLE `requests_fts` USING fts5(
  reference,
  subject,
  description,
  content='service_requests',
  content_rowid='rowid',
  tokenize='porter unicode61'
);
--> statement-breakpoint
CREATE TRIGGER `service_requests_ai` AFTER INSERT ON `service_requests` BEGIN
  INSERT INTO requests_fts(rowid, reference, subject, description)
  VALUES (NEW.rowid, NEW.reference, NEW.subject, NEW.description);
END;
--> statement-breakpoint
CREATE TRIGGER `service_requests_ad` AFTER DELETE ON `service_requests` BEGIN
  INSERT INTO requests_fts(requests_fts, rowid, reference, subject, description)
  VALUES ('delete', OLD.rowid, OLD.reference, OLD.subject, OLD.description);
END;
--> statement-breakpoint
CREATE TRIGGER `service_requests_au` AFTER UPDATE ON `service_requests` BEGIN
  INSERT INTO requests_fts(requests_fts, rowid, reference, subject, description)
  VALUES ('delete', OLD.rowid, OLD.reference, OLD.subject, OLD.description);
  INSERT INTO requests_fts(rowid, reference, subject, description)
  VALUES (NEW.rowid, NEW.reference, NEW.subject, NEW.description);
END;
