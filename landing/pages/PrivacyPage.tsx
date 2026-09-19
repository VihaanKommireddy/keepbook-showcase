/**
 * /privacy — the transcription of PRIVACY.md at the repo root (round 2 §4).
 * The .md is the source of truth and this page is its published form: same
 * headings, same numbering, same words. legal.test.tsx reads the file and
 * fails if any line of it is missing here, so edit the two together.
 */
import type { JSX } from 'react';
import { LegalLayout } from './LegalLayout';

export default function PrivacyPage(): JSX.Element {
  return (
    <LegalLayout title="Keepbook Privacy Policy" effective="September 17, 2026">
      <p>
        This Privacy Policy describes how Keepbook ("Keepbook", "we", "us", or "our") collects, uses,
        stores, and discloses information in connection with the Keepbook software and website at
        thekeepbook.com (together, the "Service"). By creating an account or using the Service you agree
        to this Privacy Policy and to the Keepbook Terms of Service. If you do not agree, do not use the
        Service.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>
          <strong>"Customer"</strong> means the insurance agency, agent, or other business that creates
          an account and uses the Service.
        </li>
        <li>
          <strong>"Customer Data"</strong> means all information a Customer enters into, imports into, or
          generates within the Service, including information about the Customer's clients, prospects,
          and policies.
        </li>
        <li>
          <strong>"Client"</strong> means an individual or business whose information a Customer stores
          in the Service. Clients are the Customer's clients, not Keepbook's.
        </li>
        <li>
          <strong>"Personal Information"</strong> means information that identifies, relates to, or could
          reasonably be linked to a particular individual.
        </li>
        <li>
          <strong>"Account Information"</strong> means the information Keepbook collects directly from a
          Customer to create and secure an account.
        </li>
      </ul>

      <h2>2. Roles: Keepbook is a service provider for Customer Data</h2>
      <p>
        Keepbook provides software that a Customer uses to manage its own book of business. With respect
        to Customer Data, the Customer determines what information is collected and how it is used, and
        Keepbook processes that information only to provide the Service to the Customer, as directed by
        the Customer through the Service's features. In the terminology of privacy laws, the Customer is
        the controller or business, and Keepbook is a processor or service provider.
      </p>
      <p>
        Each Customer is solely responsible for (a) having a lawful basis to collect and store its
        Clients' Personal Information, (b) providing any notices its Clients are entitled to, (c) the
        accuracy of Customer Data, and (d) complying with laws that apply to its own business, including
        insurance, consumer-protection, and anti-spam laws. Keepbook has no direct relationship with
        Clients. A Client who has questions about information a Customer stores in the Service should
        contact that Customer directly.
      </p>

      <h2>3. Information we collect</h2>
      <p>
        <strong>3.1 Account Information (collected from the Customer).</strong> Email address and
        password. Passwords are stored only as a salted scrypt hash and are never stored or logged in
        readable form.
      </p>
      <p>
        <strong>3.2 Customer Data (entered or imported by the Customer).</strong> Names, phone numbers,
        email addresses, mailing addresses, policy details (carrier, line, policy number, premium,
        dates), notes, tasks, leads, tags, and the communication history the Customer records. When a
        Customer enables Autopilot, the Service also stores a record of each email sent on the Customer's
        behalf and whether a reply was received.
      </p>
      <p>
        <strong>3.3 Intake submissions (entered by a Client at the Customer's request).</strong> When a
        Customer sends a Client an intake link, the information the Client enters on that form is stored
        as Customer Data: name, phone number, email address, and the answers to the questions the
        Customer's form asks. The form identifies the Customer as the party collecting the information
        and links to this Privacy Policy.
      </p>
      <p>
        <strong>3.4 Public rate-filing information.</strong> The Service tracks insurance rate filings
        that carriers file publicly with the North Carolina Department of Insurance. This is public
        information and is not Personal Information.
      </p>
      <p>
        <strong>3.5 Technical and log information (collected automatically).</strong> The Service records
        the HTTP method, request path, response status, and timing of each request for reliability and
        security monitoring. Query strings and form contents are not recorded in these logs. Our hosting
        and network providers maintain their own standard access logs, which may include IP addresses and
        user-agent strings, for a limited period.
      </p>
      <p>
        <strong>3.6 Cookies and local storage.</strong> See Section 8.
      </p>
      <p>
        <strong>3.7 Demo requests.</strong> If you ask for a demo through the website, we keep the name, agency, email address, phone number, and note you send, and use them only to reply to you and arrange the demo.
      </p>
      <p>
        We do not collect Personal Information from third-party data brokers, and we do not use
        advertising identifiers, analytics services, tracking pixels, or cross-site tracking of any kind.
      </p>

      <h2>4. How we use information</h2>
      <p>We use Account Information and technical information to:</p>
      <ul>
        <li>create, authenticate, and secure the Customer's account;</li>
        <li>provide, maintain, and improve the Service;</li>
        <li>detect, prevent, and respond to abuse, fraud, security incidents, and technical problems;</li>
        <li>communicate with the Customer about the account, the Service, and changes to our policies; and</li>
        <li>comply with legal obligations and enforce our Terms of Service.</li>
      </ul>
      <p>
        We use Customer Data only to provide the Service to the Customer as directed by the Customer
        through the Service's features (for example, storing a client record, scheduling a task, sending
        an email the Customer has configured, or producing an export). We do not use Customer Data for
        advertising, for profiling Clients, for sale to anyone, or to train machine-learning or
        artificial-intelligence models.
      </p>
      <p>
        Where the law of a Customer's or Client's jurisdiction requires a legal basis for processing, our
        bases are: performance of our contract with the Customer; our legitimate interests in operating a
        secure and reliable Service; compliance with legal obligations; and, where applicable, the
        Customer's instructions as controller.
      </p>

      <h2>5. How we disclose information</h2>
      <p>
        <strong>5.1 No sale or sharing for advertising.</strong> We do not sell Personal Information and
        do not share it for cross-context behavioral advertising, as those terms are defined under the
        California Consumer Privacy Act or similar laws.
      </p>
      <p>
        <strong>5.2 Service providers.</strong> We disclose information to the following providers only
        as necessary to operate the Service, and each is bound by its own terms to use the information
        only to provide its service to us:
      </p>
      <div className="kb-legal__tablewrap">
        <table className="kb-legal__table">
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Purpose</th>
              <th scope="col">What it can access</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Render Services, Inc.</td>
              <td>Hosting of the application server and its storage</td>
              <td>The server and the disk on which Customer Data is stored</td>
            </tr>
            <tr>
              <td>Cloudflare, Inc.</td>
              <td>Domain name services and network protection</td>
              <td>Network traffic between users and the Service</td>
            </tr>
            <tr>
              <td>Resend, Inc.</td>
              <td>
                Delivery of email sent through the Service by a Customer (Autopilot emails, intake links
                and reminders)
              </td>
              <td>
                Recipient addresses and message contents of email the Customer sends; nothing is sent
                unless the Customer enables a sending feature
              </td>
            </tr>
            <tr>
              <td>Backblaze, Inc.</td>
              <td>Off-site storage of encrypted backups, once enabled</td>
              <td>Encrypted backup archives that Backblaze cannot decrypt</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>5.3 Legal requirements and protection of rights.</strong> We may disclose information if
        we believe in good faith that doing so is required by law, subpoena, or court order, or is
        necessary to protect the rights, property, or safety of Keepbook, our Customers, Clients, or the
        public. Where lawful, we will notify the affected Customer before disclosing Customer Data.
      </p>
      <p>
        <strong>5.4 Business transfers.</strong> If Keepbook is involved in a merger, acquisition,
        financing, or sale of assets, information may be transferred as part of that transaction. We will
        notify Customers by email before their information becomes subject to a different privacy policy.
      </p>
      <p>
        <strong>5.5 With the Customer's direction.</strong> We disclose Customer Data when the Customer
        directs us to through the Service, for example by sending an email to a Client or exporting a
        file.
      </p>

      <h2>6. Data storage, location, and retention</h2>
      <p>
        <strong>6.1 Location.</strong> The Service is hosted on servers located in the United States. If
        a Customer or Client is located outside the United States, their information is transferred to
        and processed in the United States, where privacy laws may differ from those of their home
        jurisdiction.
      </p>
      <p>
        <strong>6.2 Isolation.</strong> Each Customer's data is stored in its own database file. No
        Customer can access another Customer's data through the Service.
      </p>
      <p>
        <strong>6.3 Backups.</strong> An encrypted backup of all data is created nightly using AES-256-GCM
        with a passphrase held only by Keepbook. A limited number of recent backups are retained, and
        older backups are deleted automatically as new ones are created. Off-site storage of those
        encrypted backups with Backblaze is being enabled; this Policy will be updated when it is live.
      </p>
      <p>
        <strong>6.4 Retention.</strong> We retain Account Information and Customer Data for as long as
        the Customer's account is active. Server logs are retained for a limited period for security and
        reliability purposes. When an account is deleted under Section 7, the Customer's database file is
        deleted within seven (7) days, and the data is removed from backups as those backups rotate,
        within thirty (30) days. We may retain information longer where required by law or to resolve
        disputes and enforce our agreements.
      </p>

      <h2>7. Your choices and rights</h2>
      <p>
        <strong>7.1 Access, correction, and deletion within the Service.</strong> A Customer can view,
        edit, and delete any record in its book at any time. Every table can be exported in CSV format
        from Settings. "Clear all data" in Settings permanently deletes every client, policy, task, and
        note in the account.
      </p>
      <p>
        <strong>7.2 Account deletion.</strong> A Customer may request deletion of its account by emailing
        the address in Section 13 from the email address on the account. We will delete the account as
        described in Section 6.4 and confirm by email.
      </p>
      <p>
        <strong>7.3 Rights under privacy laws.</strong> Depending on where you live, you may have rights
        to access, correct, delete, port, or restrict the processing of your Personal Information, to
        object to processing, to opt out of sale or sharing (we do neither), and not to be discriminated
        against for exercising those rights. Residents of the European Economic Area, the United Kingdom,
        and Switzerland may also have the right to lodge a complaint with a supervisory authority. To
        exercise any right, email the address in Section 13. We will verify your identity and respond
        within the time the applicable law requires. If you are a Client whose information a Customer
        stores in the Service, we will refer your request to that Customer, as the party responsible for
        that data, and assist the Customer in responding.
      </p>
      <p>
        <strong>7.4 Communications.</strong> We send Customers emails necessary to operate the account
        (for example, password resets and notices about this Policy). These are not marketing emails and
        cannot be opted out of while the account is active.
      </p>

      <h2>8. Cookies and local storage</h2>
      <p>
        The Service sets one cookie, named <code>kb_session</code>. It is a strictly necessary cookie
        that keeps a signed-in Customer signed in for up to thirty (30) days. It is marked HttpOnly and
        SameSite=Strict, is transmitted only over HTTPS in production, and is not used for tracking or
        advertising. No third-party cookies are set. Because this cookie is essential to the operation of
        the Service and serves no other purpose, the Service does not display a cookie consent banner.
      </p>
      <p>
        The Service may store a Customer's display preferences (such as light or dark theme and sidebar
        state) in the browser's local storage. That information stays on the Customer's device and is not
        transmitted to Keepbook.
      </p>
      <p>You can block or delete cookies through your browser settings; doing so will sign you out and prevent you from signing in.</p>

      <h2>9. Security</h2>
      <p>
        We implement administrative, technical, and physical safeguards appropriate to the size of the
        Service and the sensitivity of the information, including: encryption in transit (HTTPS) for all
        traffic; salted scrypt hashing of passwords; HttpOnly, same-site session cookies with expiry; rate
        limiting of sign-in attempts; per-Customer data isolation; encrypted backups; and restriction of
        production access to the operator of the Service.
      </p>
      <p>
        No method of transmission or storage is completely secure, and we cannot guarantee absolute
        security. If we become aware of a security incident that affects Customer Data, we will notify
        affected Customers without undue delay and in any event within the time required by applicable
        law, and will provide the information Customers need to meet their own notification obligations.
      </p>

      <h2>10. Children's privacy</h2>
      <p>
        The Service is intended for use by businesses and is not directed to children. We do not
        knowingly collect Personal Information directly from anyone under the age of thirteen (13).
        Customer Data may include information about minors in a Client's household (for example, a young
        driver on an auto policy) entered by an adult Customer or Client; that information is Customer
        Data governed by Section 2. If you believe a child has provided Personal Information to us
        directly, contact us and we will delete it.
      </p>

      <h2>11. Third-party websites</h2>
      <p>
        The Service may contain links to third-party websites, including public regulatory filings and a
        Customer's own review or business pages. This Privacy Policy does not apply to those websites,
        and we are not responsible for their content or privacy practices.
      </p>

      <h2>12. Changes to this Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the effective
        date at the top of this page. If a change materially reduces your rights or materially changes
        how we use Personal Information, we will notify Customers by email to the address on the account
        before the change takes effect. Continued use of the Service after the effective date of a
        revised Policy constitutes acceptance of the revised Policy.
      </p>

      <h2>13. Contact</h2>
      <p>Questions, requests, and complaints about this Privacy Policy may be sent to:</p>
      <p className="kb-legal__contact">
        Keepbook
        <br />
        Cary, North Carolina, United States
        <br />
        <a href="mailto:vihaankommireddy@gmail.com">vihaankommireddy@gmail.com</a>
      </p>
    </LegalLayout>
  );
}
