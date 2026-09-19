/**
 * /terms — the transcription of TERMS.md at the repo root (round 2 §4). The
 * .md is the source of truth and this page is its published form: same
 * headings, same numbering, same words, and the all-caps paragraphs the law
 * expects to be conspicuous stay exactly as written. legal.test.tsx reads
 * the file and fails if any line of it is missing here, so edit the two
 * together.
 */
import type { JSX } from 'react';
import { LegalLayout } from './LegalLayout';

export default function TermsPage(): JSX.Element {
  return (
    <LegalLayout title="Keepbook Terms of Service" effective="September 15, 2026">
      <p>
        These Terms of Service (the "Terms") are a binding agreement between Keepbook ("Keepbook", "we",
        "us", or "our") and the person or entity that creates an account or uses the Keepbook software and
        website at thekeepbook.com (the "Service"). PLEASE READ THESE TERMS CAREFULLY. THEY INCLUDE A
        DISCLAIMER OF WARRANTIES (SECTION 11), A LIMITATION OF LIABILITY (SECTION 12), AND AN
        INDEMNIFICATION OBLIGATION (SECTION 13). BY CREATING AN ACCOUNT, CLICKING TO ACCEPT, OR USING THE
        SERVICE, YOU AGREE TO THESE TERMS AND TO OUR PRIVACY POLICY. IF YOU DO NOT AGREE, DO NOT USE THE
        SERVICE.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li>
          <strong>"Customer"</strong> or <strong>"you"</strong> means the insurance agency, agent, or
          other business that creates an account, and the individual accepting these Terms on its behalf.
        </li>
        <li>
          <strong>"Customer Data"</strong> means all information you enter into, import into, or generate
          within the Service, including information about your clients, prospects, and policies.
        </li>
        <li>
          <strong>"Client"</strong> means an individual or business whose information you store in the
          Service.
        </li>
        <li>
          <strong>"Autopilot"</strong> means the features of the Service that send email to Clients on
          your behalf, including rate-change outreach, intake links, reminders, and review requests.
        </li>
      </ul>

      <h2>2. Eligibility and accounts</h2>
      <p>
        <strong>2.1</strong> You must be at least eighteen (18) years old and able to form a binding
        contract to use the Service. If you accept these Terms on behalf of a business, you represent
        that you have authority to bind that business, and "you" includes that business.
      </p>
      <p>
        <strong>2.2</strong> You are responsible for maintaining the confidentiality of your password and
        for all activity under your account. Notify us immediately at the address in Section 18 if you
        suspect unauthorized use. We are not liable for loss arising from unauthorized use of your
        account that you could have prevented.
      </p>
      <p>
        <strong>2.3</strong> You must provide accurate account information and keep it current.
      </p>

      <h2>3. The Service</h2>
      <p>
        <strong>3.1</strong> The Service is software that helps an independent insurance agency organize
        its book of business, track public insurance rate filings against that book, and communicate with
        its clients. We may modify, add, or remove features at any time.
      </p>
      <p>
        <strong>3.2</strong> The Service is provided on a free plan as of the effective date. We may
        introduce paid plans in the future. We will not charge you for any plan without your express
        agreement and at least thirty (30) days' notice.
      </p>
      <p>
        <strong>3.3</strong> We may suspend or limit the Service where necessary to protect its security
        or integrity, to comply with law, or to perform maintenance. We will try to give notice in advance
        where practical.
      </p>

      <h2>4. Customer Data and your responsibilities</h2>
      <p>
        <strong>4.1 Ownership.</strong> As between you and Keepbook, you own Customer Data. You grant
        Keepbook a limited, non-exclusive license to host, store, process, transmit, back up, and display
        Customer Data solely to provide the Service to you and as otherwise directed by you through the
        Service.
      </p>
      <p>
        <strong>4.2 You are the controller.</strong> You determine what Customer Data is collected and
        how it is used. You are solely responsible for: (a) having a lawful basis, and any consent
        required, to collect, store, and use your Clients' personal information in the Service; (b)
        providing your Clients any privacy notices they are entitled to; (c) the accuracy, legality, and
        appropriateness of Customer Data; (d) responding to your Clients' requests concerning their
        information; and (e) complying with all laws applicable to your business, including insurance
        regulations, consumer-protection laws, and privacy laws. Keepbook has no relationship with your
        Clients and no obligation to them.
      </p>
      <p>
        <strong>4.3 Sensitive information.</strong> Do not enter Social Security numbers, driver's license
        numbers, financial account numbers, payment card numbers, health information, or other information
        subject to heightened legal protection unless a field is expressly provided for it. You are
        responsible for any such information you enter.
      </p>
      <p>
        <strong>4.4 Export and deletion.</strong> You can export Customer Data in CSV format and delete
        records at any time from within the Service. On termination, your data will be deleted as
        described in the Privacy Policy. We are not obligated to retain Customer Data after termination.
      </p>

      <h2>5. Autopilot and email</h2>
      <p>
        <strong>5.1</strong> When you enable Autopilot, the Service sends email to your Clients using your
        name and the content you have configured or approved. You are the sender of those messages. You
        are solely responsible for their content, for the accuracy of the recipient list, and for
        compliance with the CAN-SPAM Act, the Telephone Consumer Protection Act, state law, and any
        consent or opt-out obligations that apply to your communications with your Clients.
      </p>
      <p>
        <strong>5.2</strong> The Service holds each Autopilot email for a period before sending so that
        you can review or cancel it. You are responsible for reviewing what the Service is about to send.
        A message you do not cancel is a message you have approved.
      </p>
      <p>
        <strong>5.3</strong> We may refuse, throttle, or stop sending email that we reasonably believe is
        unlawful, unsolicited, deceptive, or harmful to the reputation or deliverability of the Service.
      </p>

      <h2>6. Rate-filing information is public information, not advice</h2>
      <p>
        <strong>6.1</strong> The Service tracks rate filings that insurance carriers file publicly with
        state regulators, and shows you which filings may affect Clients in your book based on the
        carrier, line, and location information you have entered. This information is derived from public
        records and from Customer Data, and is provided for your convenience only.
      </p>
      <p>
        <strong>6.2</strong> THE SERVICE DOES NOT PREDICT, CALCULATE, OR GUARANTEE ANY CLIENT'S PREMIUM,
        RENEWAL PRICE, OR COVERAGE. A rate filing reflects a statewide average change requested or
        approved by a carrier and may not apply to a particular policy at all. Only the carrier determines
        a policy's premium. You are responsible for verifying any information before relying on it or
        communicating it to a Client, and for the accuracy of anything you tell a Client.
      </p>
      <p>
        <strong>6.3</strong> Nothing in the Service is insurance advice, legal advice, financial advice,
        or a recommendation to buy, sell, renew, or cancel any policy. Keepbook is not an insurance
        agency, broker, or carrier, and is not affiliated with any carrier, regulator, or ratings bureau.
      </p>

      <h2>7. Acceptable use</h2>
      <p>
        You agree not to: (a) use the Service in violation of any law or regulation; (b) send unsolicited
        or deceptive communications through the Service; (c) upload malicious code or attempt to interfere
        with the Service's operation or security; (d) attempt to access another Customer's data or any
        part of the Service you are not authorized to access; (e) reverse engineer, scrape, or copy the
        Service except as permitted by law; (f) resell or provide the Service to third parties without our
        written consent; or (g) use the Service to store information you do not have the right to store.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Service, including its software, design, and content (excluding Customer Data), is owned by
        Keepbook and protected by intellectual-property laws. We grant you a limited, non-exclusive,
        non-transferable, revocable license to use the Service in accordance with these Terms. You may not
        remove any proprietary notices. If you provide feedback or suggestions, we may use them without
        obligation to you.
      </p>

      <h2>9. Third-party services</h2>
      <p>
        The Service relies on third-party providers for hosting, networking, email delivery, and backup
        storage, as described in the Privacy Policy. Those providers' availability and conduct are outside
        our control. The Service may link to third-party websites, including public regulatory records and
        your own business pages; we are not responsible for their content, accuracy, or practices.
      </p>

      <h2>10. Availability, backups, and support</h2>
      <p>
        <strong>10.1</strong> We aim to keep the Service available and to back up data nightly, but we do
        not guarantee uninterrupted or error-free operation, and we do not guarantee that any backup will
        be complete, current, or recoverable. You are responsible for maintaining your own copies of
        Customer Data using the export features.
      </p>
      <p>
        <strong>10.2</strong> Support is provided by email on a best-effort basis. We do not commit to
        response times.
      </p>

      <h2>11. Disclaimer of warranties</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITH ALL FAULTS, AND WITHOUT WARRANTY OF ANY
        KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, KEEPBOOK DISCLAIMS ALL WARRANTIES, EXPRESS, IMPLIED,
        OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
        NON-INFRINGEMENT, ACCURACY, AND QUIET ENJOYMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING
        OR USAGE OF TRADE. KEEPBOOK DOES NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS, BE
        UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, THAT DATA WILL NOT BE LOST,
        OR THAT ANY INFORMATION PROVIDED THROUGH THE SERVICE, INCLUDING RATE-FILING INFORMATION, IS
        ACCURATE, COMPLETE, OR CURRENT. YOU USE THE SERVICE AT YOUR OWN RISK.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        <strong>12.1</strong> TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL KEEPBOOK OR ITS
        OWNERS, OPERATORS, CONTRACTORS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, BUSINESS,
        GOODWILL, DATA, OR CLIENTS, OR FOR THE COST OF SUBSTITUTE SERVICES, ARISING OUT OF OR RELATING TO
        THESE TERMS OR THE SERVICE, WHETHER BASED ON CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT
        LIABILITY, OR ANY OTHER THEORY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
      </p>
      <p>
        <strong>12.2</strong> TO THE FULLEST EXTENT PERMITTED BY LAW, KEEPBOOK'S TOTAL CUMULATIVE
        LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF
        (A) THE AMOUNT YOU PAID KEEPBOOK FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING
        RISE TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (US $100).
      </p>
      <p>
        <strong>12.3</strong> WITHOUT LIMITING THE FOREGOING, KEEPBOOK IS NOT LIABLE FOR: ANY DECISION YOU
        OR A CLIENT MAKES IN RELIANCE ON INFORMATION IN THE SERVICE, INCLUDING RATE-FILING INFORMATION;
        ANY COMMUNICATION YOU SEND THROUGH THE SERVICE; ANY LOSS OF CUSTOMER DATA THAT YOU COULD HAVE
        PREVENTED BY EXPORTING IT; ANY ACT OR OMISSION OF A THIRD-PARTY PROVIDER; OR ANY UNAUTHORIZED
        ACCESS RESULTING FROM YOUR FAILURE TO SECURE YOUR ACCOUNT.
      </p>
      <p>
        <strong>12.4</strong> Some jurisdictions do not allow the exclusion of certain warranties or the
        limitation of certain damages, so some of the above limitations may not apply to you. In that
        case, our liability is limited to the fullest extent permitted by applicable law. The limitations
        in this Section are an essential basis of the bargain between you and Keepbook and apply even if a
        remedy fails of its essential purpose.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You will defend, indemnify, and hold harmless Keepbook and its owners, operators, contractors, and
        suppliers from and against any claims, damages, losses, liabilities, costs, and expenses
        (including reasonable attorneys' fees) arising out of or relating to: (a) Customer Data, including
        any claim by a Client concerning information you stored or communications you sent; (b) your use
        of the Service in violation of these Terms or applicable law; (c) any email or other communication
        sent through the Service on your behalf; (d) any advice, quote, or representation you make to a
        Client; or (e) your violation of any third party's rights.
      </p>

      <h2>14. Term and termination</h2>
      <p>
        <strong>14.1</strong> These Terms apply from the moment you first use the Service and continue
        until terminated.
      </p>
      <p>
        <strong>14.2</strong> You may terminate at any time by requesting account deletion as described in
        the Privacy Policy.
      </p>
      <p>
        <strong>14.3</strong> We may suspend or terminate your account immediately if you breach these
        Terms, if required by law, or if continuing to provide the Service would create a legal or
        security risk. We may also terminate the Service as a whole on at least thirty (30) days' notice
        by email, in which case you will have that period to export Customer Data.
      </p>
      <p>
        <strong>14.4</strong> Sections 4.2, 4.3, 6, 8, 11, 12, 13, 15, 16, and 17 survive termination.
      </p>

      <h2>15. Governing law and disputes</h2>
      <p>
        <strong>15.1</strong> These Terms are governed by the laws of the State of North Carolina and the
        federal laws of the United States, without regard to conflict-of-law principles.
      </p>
      <p>
        <strong>15.2</strong> Before filing any claim, you agree to contact us at the address in Section
        18 and to attempt in good faith to resolve the dispute informally for at least thirty (30) days.
      </p>
      <p>
        <strong>15.3</strong> Any dispute that is not resolved informally will be brought exclusively in
        the state or federal courts located in Wake County, North Carolina, and you consent to the
        personal jurisdiction and venue of those courts. Any claim must be filed within one (1) year after
        it arises, or it is permanently barred.
      </p>
      <p>
        <strong>15.4</strong> TO THE FULLEST EXTENT PERMITTED BY LAW, EACH PARTY WAIVES ANY RIGHT TO A
        JURY TRIAL AND AGREES THAT DISPUTES WILL BE RESOLVED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A
        CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.
      </p>

      <h2>16. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. When we do, we will revise the effective date at the
        top of this page and, for material changes, notify you by email to the address on your account at
        least fourteen (14) days before the change takes effect. Continued use of the Service after the
        effective date of revised Terms constitutes acceptance of them. If you do not agree to a change,
        stop using the Service and request deletion of your account before the change takes effect.
      </p>

      <h2>17. General</h2>
      <p>
        <strong>17.1 Entire agreement.</strong> These Terms and the Privacy Policy are the entire
        agreement between you and Keepbook regarding the Service and supersede any prior agreements.
      </p>
      <p>
        <strong>17.2 Severability.</strong> If any provision of these Terms is held unenforceable, it will
        be enforced to the maximum extent permitted and the remaining provisions will remain in effect.
      </p>
      <p>
        <strong>17.3 Waiver.</strong> Our failure to enforce a provision is not a waiver of our right to do
        so later.
      </p>
      <p>
        <strong>17.4 Assignment.</strong> You may not assign these Terms without our written consent. We
        may assign them in connection with a merger, acquisition, or sale of assets.
      </p>
      <p>
        <strong>17.5 No third-party beneficiaries.</strong> These Terms create no rights in any third
        party, including Clients.
      </p>
      <p>
        <strong>17.6 Force majeure.</strong> We are not liable for any failure or delay caused by events
        beyond our reasonable control, including outages of third-party providers, internet failures, acts
        of government, or natural disasters.
      </p>
      <p>
        <strong>17.7 Notices.</strong> We may give you notice by email to the address on your account or
        by posting within the Service. You may give us notice at the address in Section 18.
      </p>

      <h2>18. Contact</h2>
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
