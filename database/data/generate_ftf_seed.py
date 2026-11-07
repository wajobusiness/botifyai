import os
import sqlite3
import uuid
import random
import json
from datetime import datetime, timedelta

def main():
    sql_lines = []
    now = datetime.now()
    
    def q(val):
        if val is None:
            return "NULL"
        if isinstance(val, (int, float)):
            return str(val)
        if isinstance(val, bool):
            return "1" if val else "0"
        s = str(val).replace("'", "''")
        return f"'{s}'"

    def emit(stmt):
        sql_lines.append(stmt.strip())

    emit("-- ===========================================================================")
    emit("-- FTF DIGITAL SOLUTIONS LIMITED (ayo@ftfdigitalsolutions.com) SEED SCRIPT")
    emit("-- Target: BotifyAI.cloud Commerce & Enterprise Telemetry Database")
    emit("-- Client: FTF Digital Solutions Limited (Cross-border logistics & shipping)")
    emit("-- Dynamic Timestamps anchored to active 30-day dashboard reporting window")
    emit("-- ===========================================================================")
    emit("")

    # 1. Clients
    emit("-- 1. Client Enterprise Record")
    created_client = (now - timedelta(days=300)).strftime("%Y-%m-%d %H:%M:%S")
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    emit("INSERT OR REPLACE INTO clients (id, name, email, status, base_currency, currency_symbol, currency_position, primary_color, created_at, updated_at)")
    emit(f"VALUES (10, 'FTF Digital Solutions Limited', 'ayo@ftfdigitalsolutions.com', 'active', 'NGN', '₦', 'before', '#0D9488', '{created_client}', '{now_str}');")
    emit("")

    # 2. Users
    emit("-- 2. Client Administrator (Ayo)")
    emit("INSERT OR REPLACE INTO users (id, client_id, workspace_id, name, email, role, status, client_role, email_verified_at, password, locale, display_currency, timezone, theme, created_at, updated_at)")
    emit(f"VALUES (10, 10, 10, 'Ayo', 'ayo@ftfdigitalsolutions.com', 'client', 'active', 'administrator', '{created_client}', '$2y$12$4e9eDq1EdfgU52i6l8vB0eJ2o3eI9fP2a9b.e.v10F.e12345678', 'en', 'NGN', 'Africa/Lagos', 'light', '{created_client}', '{now_str}');")
    emit("")

    # 3. Workspaces
    emit("-- 3. Enterprise Workspace")
    emit("INSERT OR REPLACE INTO workspaces (id, owner_id, client_id, name, default_locale, currency_code, created_at, updated_at)")
    emit(f"VALUES (10, 10, 10, 'FTF Digital Solutions Workspace', 'en', 'NGN', '{created_client}', '{now_str}');")
    emit("")

    # 4. Workspace User Pivot
    emit("-- 4. Workspace Membership Pivot")
    emit("INSERT OR REPLACE INTO workspace_user (workspace_id, user_id, role, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'owner', '{created_client}', '{now_str}');")
    emit("")

    # 5. Client Subscription
    emit("-- 5. Active Enterprise Subscription")
    renews_str = (now + timedelta(days=60)).strftime("%Y-%m-%d %H:%M:%S")
    emit("INSERT OR REPLACE INTO client_subscriptions (id, client_id, plan_id, billing_cycle, starts_at, ends_at, status, created_at, updated_at)")
    emit(f"VALUES (10, 10, 1, 'monthly', '{created_client}', '{renews_str}', 'active', '{created_client}', '{now_str}');")
    emit("")

    # 6. Channel Accounts
    emit("-- 6. Omnichannel Gateways (WhatsApp, Instagram, Messenger)")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, phone_number_id, credentials, status, created_at, updated_at)")
    emit(f"VALUES (101, 10, 'whatsapp', 'meta', 'FTF Logistics WhatsApp Support & Tracking', '104928572910482', '{{\"system_user_token\":\"EAAG_FTF_LIVE_META_TOKEN_VERIFIED\"}}', 'active', '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, credentials, status, created_at, updated_at)")
    emit(f"VALUES (102, 10, 'instagram', 'meta', '@ftflogistics', '{{\"access_token\":\"IG_FTF_VERIFIED_TOKEN\"}}', 'active', '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO channel_accounts (id, workspace_id, channel, provider, display_name, credentials, status, created_at, updated_at)")
    emit(f"VALUES (103, 10, 'messenger', 'meta', 'FTF Digital Solutions Limited', '{{\"access_token\":\"PAGE_FTF_VERIFIED_TOKEN\"}}', 'active', '{created_client}', '{now_str}');")
    emit("")

    # 7. WhatsApp Business Account & Phone Numbers
    emit("-- 7. WhatsApp Cloud API Integration")
    emit("INSERT OR REPLACE INTO whatsapp_business_accounts (id, workspace_id, waba_id, credentials, webhook_verify_token, status, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'waba_ftf_2024_enterprise', '{{\"system_user_token\":\"EAAG_FTF_LIVE_META_TOKEN_VERIFIED\"}}', 'wh_token_ftf_enterprise_random_9918237', 'active', '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO whatsapp_phone_numbers (id, waba_id_fk, phone_number_id, display_phone, verified_name, quality_rating, code_verification_status, created_at, updated_at)")
    emit(f"VALUES (10, 10, '104928572910482', '+234 813 366 2232', 'FTF Digital Solutions Limited', 'GREEN', 'VERIFIED', '{created_client}', '{now_str}');")
    emit("")

    # 8. WhatsApp Auto Replies
    emit("-- 8. WhatsApp Instant Quotation & Package Tracking Auto-Replies")
    emit("INSERT OR REPLACE INTO whatsapp_auto_replies (id, workspace_id, keyword, name, match_type, reply_text, is_active, created_at, updated_at)")
    emit(f"VALUES (101, 10, 'track', 'Waybill & Package Status Tracking', 'contains', '📦 FTF Logistics Package Tracker: Please reply with your 8-digit Waybill Number (e.g. WB-100284) to get instant live GPS dispatch status.', 1, '{created_client}', '{now_str}');")
    emit("INSERT OR REPLACE INTO whatsapp_auto_replies (id, workspace_id, keyword, name, match_type, reply_text, is_active, created_at, updated_at)")
    emit(f"VALUES (102, 10, 'quote', 'Instant Shipping Rate Quotation', 'contains', '✈️ FTF Instant Shipping Quotation: Instant rates for UK Air Express, North America Priority Courier, and Nationwide Interstate Delivery.', 1, '{created_client}', '{now_str}');")
    emit("")

    # 9. Merchant Bank Account
    emit("-- 9. Merchant Bank Settlement Account (Zenith Bank PLC)")
    emit("INSERT OR REPLACE INTO merchant_bank_accounts (id, workspace_id, bank_name, bank_code, account_number, account_name, recipient_code, currency, is_default, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'Zenith Bank PLC', '057', '1018400021', 'FTF DIGITAL SOLUTIONS LIMITED', 'RCP_ftf_zenith_verified', 'NGN', 1, '{created_client}', '{now_str}');")
    emit("")

    # 10. Merchant Wallet & Ledger
    emit("-- 10. Merchant Escrow & Settlement Wallet (₦18,400,000.00 Gross Commercial Revenue)")
    emit("INSERT OR REPLACE INTO merchant_wallets (id, workspace_id, currency, available_balance_cents, pending_balance_cents, total_withdrawn_cents, total_earned_cents, is_frozen, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'NGN', 1840000000, 0, 0, 1840000000, 0, '{created_client}', '{now_str}');")
    emit("")
    emit("-- 10b. Merchant Double-Entry Accounting Ledger")
    emit(f"INSERT OR REPLACE INTO merchant_ledger_entries (id, workspace_id, wallet_id, entry_type, amount_cents, fee_cents, net_amount_cents, running_balance_cents, currency, reference_type, description, created_at, updated_at) VALUES (1, 10, 10, 'sale_credit', 1840000000, 27600000, 1812400000, 1812400000, 'NGN', 'order', 'Cumulative Processed Waybill Bookings & Freight Revenue', '{created_client}', '{now_str}');")
    emit("")

    # 11. Ecommerce Store
    emit("-- 11. Native Digital Commerce Storefront")
    pixels = json.dumps({
        "meta_pixel_id": "104928572910482",
        "meta_capi_token": "EAAG_FTF_CAPI_ACTIVE",
        "ga4_measurement_id": "G-FTFLOGISTICS",
        "tiktok_pixel_id": "TT_FTF_CARGO",
        "gtm_container_id": "GTM-FTF2024",
        "clarity_project_id": "clarity_ftf_live"
    })
    emit("INSERT OR REPLACE INTO ecommerce_stores (id, workspace_id, platform, name, domain, slug, currency, status, support_email, support_phone, brand_color, is_published, bank_account_id, marketing_pixels, published_at, created_at, updated_at)")
    emit(f"VALUES (10, 10, 'native', 'FTF Digital Solutions Limited', 'native', 'ftf-logistics', 'NGN', 'connected', 'ayo@ftfdigitalsolutions.com', '+234 813 366 2232', '#0D9488', 1, 10, '{pixels}', '{created_client}', '{created_client}', '{now_str}');")
    emit("")

    # 12. Products (5 Items)
    emit("-- 12. Store Products (Waybill Services)")
    products = [
        (101, 'Waybill Booking & Freight Service', 40000.00, 'Waybill Booking & Freight Service'),
        (102, 'UK Air Express Cargo (3-5 Days)', 55500.00, 'UK Air Express Cargo (3-5 Days)'),
        (103, 'North America Priority Cargo (5-7 Days)', 75000.00, 'North America Priority Cargo (5-7 Days)'),
        (104, 'Interstate Doorstep Courier Express', 18500.00, 'Interstate Doorstep Courier Express'),
        (105, 'Customs Duty Clearance & Port Handling', 25000.00, 'Customs Duty Clearance & Port Handling')
    ]
    for p_id, p_name, p_price, p_desc in products:
        p_slug = p_name.lower().replace(' ', '-').replace('&', 'and')
        emit(f"INSERT OR REPLACE INTO ecommerce_products (id, workspace_id, store_id, platform, name, slug, price, currency, product_type, description, is_published, created_at, updated_at)")
        emit(f"VALUES ({p_id}, 10, 10, 'native', {q(p_name)}, '{p_slug}', {p_price}, 'NGN', 'digital', {q(p_desc)}, 1, '{created_client}', '{now_str}');")
    emit("")

    # 13. Contact Tags & Contacts
    emit("-- 13. Contact Tags")
    tag_defs = [
        (1, 'Logistics Client', '#0d9488'),
        (2, 'Waybill Inquiry', '#2563eb'),
        (3, 'Cross-Border Freight', '#4f46e5'),
        (4, 'VIP Shipper', '#d97706'),
        (5, 'Abandoned Cart', '#e11d48'),
        (6, 'UK Express', '#059669'),
    ]
    tag_map = {}
    for tid, tname, tcolor in tag_defs:
        tag_map[tname] = tid
        emit(f"INSERT OR REPLACE INTO contact_tags (id, workspace_id, name, color, created_at, updated_at) VALUES ({tid}, 10, {q(tname)}, '{tcolor}', '{created_client}', '{now_str}');")
    emit("")

    emit("-- 13b. Primary Nigerian Logistics Contacts (30 Top Contacts on Page 1)")
    primary_contacts = [
        (1, 'Emeka', 'Okonkwo', 'emeka.o@meridianlogistics.ng', '+234 803 241 8920', 'Lagos', ['Logistics Client', 'Waybill Inquiry', 'Cross-Border Freight']),
        (2, 'Babatunde', 'Adeyemi', 'tunde.adeyemi@crossborder.co.uk', '+234 803 555 0192', 'London / Lagos', ['Cross-Border Freight', 'UK Express']),
        (3, 'Chioma', 'Eze', 'chioma.eze@africantradehub.com', '+234 814 998 8776', 'Abuja', ['VIP Shipper', 'Logistics Client']),
        (4, 'Ngozi', 'Okonjo', 'ngozi.okonjo@ftfclient.com', '+234 802 345 6701', 'Enugu', ['Logistics Client', 'Waybill Inquiry']),
        (5, 'Aisha', 'Bello', 'aisha.bello@ftfclient.com', '+234 802 345 6702', 'Kano', ['Abandoned Cart', 'Logistics Client']),
        (6, 'Tunde', 'Bakare', 'tunde.bakare@ftfclient.com', '+234 802 345 6703', 'Ibadan', ['Waybill Inquiry']),
        (7, 'Chiamaka', 'Nze', 'chiamaka.nze@ftfclient.com', '+234 802 345 6704', 'Owerri', ['Cross-Border Freight', 'UK Express']),
        (8, 'Ibrahim', 'Musa', 'ibrahim.musa@ftfclient.com', '+234 806 712 3456', 'Kaduna', ['Logistics Client', 'Waybill Inquiry']),
        (9, 'Amaka', 'Obi', 'amaka.obi@ftfclient.com', '+234 805 123 4567', 'Port Harcourt', ['VIP Shipper', 'Cross-Border Freight']),
        (10, 'Yusuf', 'Garba', 'yusuf.garba@ftfclient.com', '+234 703 890 1234', 'Jos', ['Logistics Client']),
        (11, 'Bolaji', 'Davies', 'bolaji.davies@ftfclient.com', '+234 902 345 6789', 'Lagos', ['VIP Shipper', 'Logistics Client']),
        (12, 'Fatima', 'Dangote', 'fatima.dangote@ftfclient.com', '+234 818 234 5678', 'Kano', ['VIP Shipper', 'Logistics Client']),
        (13, 'Olumide', 'Adeleke', 'olumide.adeleke@ftfclient.com', '+234 809 123 4567', 'Ibadan', ['Waybill Inquiry']),
        (14, 'Nnamdi', 'Azikiwe', 'nnamdi.azikiwe@ftfclient.com', '+234 816 789 0123', 'Onitsha', ['Logistics Client', 'Cross-Border Freight']),
        (15, 'Folashade', 'Tinubu', 'folashade.t@ftfclient.com', '+234 813 456 7890', 'Lagos', ['VIP Shipper']),
        (16, 'Abubakar', 'Shehu', 'abubakar.shehu@ftfclient.com', '+234 803 987 6543', 'Sokoto', ['Logistics Client', 'Waybill Inquiry']),
        (17, 'Ifeanyi', 'Ubah', 'ifeanyi.ubah@ftfclient.com', '+234 814 321 0987', 'Nnewi', ['Cross-Border Freight']),
        (18, 'Damilola', 'Fashola', 'dami.fashola@ftfclient.com', '+234 805 678 1234', 'Lagos', ['Logistics Client', 'UK Express']),
        (19, 'Kemi', 'Adeosun', 'kemi.adeosun@ftfclient.com', '+234 802 987 1234', 'Abeokuta', ['VIP Shipper', 'Cross-Border Freight']),
        (20, 'Funke', 'Akindele', 'funke.a@ftfclient.com', '+234 803 111 2233', 'Lagos', ['Logistics Client']),
        (21, 'Osagie', 'Alonge', 'osagie.alonge@ftfclient.com', '+234 818 999 8888', 'Benin City', ['Waybill Inquiry']),
        (22, 'Zainab', 'Ahmed', 'zainab.ahmed@ftfclient.com', '+234 703 123 9876', 'Kaduna', ['Logistics Client', 'Cross-Border Freight']),
        (23, 'Olamide', 'Adedeji', 'olamide.adedeji@ftfclient.com', '+234 902 888 7766', 'Lagos', ['Abandoned Cart']),
        (24, 'Blessing', 'Okagbare', 'blessing.o@ftfclient.com', '+234 809 555 4433', 'Warri', ['Logistics Client', 'UK Express']),
        (25, 'Kelechi', 'Iheanacho', 'kelechi.i@ftfclient.com', '+234 816 444 3322', 'Owerri', ['VIP Shipper']),
        (26, 'Victor', 'Osimhen', 'victor.osimhen@ftfclient.com', '+234 803 777 6655', 'Lagos', ['VIP Shipper', 'Cross-Border Freight']),
        (27, 'Chinua', 'Achebe', 'chinua.achebe@ftfclient.com', '+234 814 111 9900', 'Ogidi', ['Logistics Client']),
        (28, 'Simi', 'Ogunleye', 'simi.ogunleye@ftfclient.com', '+234 805 222 3344', 'Lagos', ['Waybill Inquiry', 'UK Express']),
        (29, 'Bankole', 'Wellington', 'banky.w@ftfclient.com', '+234 802 666 7788', 'Lagos', ['VIP Shipper', 'Cross-Border Freight']),
        (30, 'Yetunde', 'Ayeni', 'yetunde.ayeni@ftfclient.com', '+234 803 888 9900', 'Ilorin', ['Logistics Client', 'Waybill Inquiry']),
    ]

    emit("DELETE FROM contact_tag_pivot;")
    for idx, (cid, fn, ln, em, ph, city, tags) in enumerate(primary_contacts):
        u = str(uuid.uuid4())
        dt = (now - timedelta(minutes=(idx * 4))).strftime("%Y-%m-%d %H:%M:%S")
        custom = json.dumps({"destination_city": city, "account_tier": "Enterprise Shipper"})
        emit("INSERT OR REPLACE INTO contacts (id, uuid, workspace_id, phone_e164, email, first_name, last_name, country, language, opt_in_whatsapp, opt_in_sms, opt_in_email, custom_fields, created_at, updated_at)")
        emit(f"VALUES ({cid}, '{u}', 10, '{ph}', '{em}', '{fn}', '{ln}', 'NG', 'en', 1, 1, 1, '{custom}', '{dt}', '{dt}');")
        for tname in tags:
            tid = tag_map[tname]
            emit(f"INSERT OR REPLACE INTO contact_tag_pivot (contact_id, tag_id) VALUES ({cid}, {tid});")

    emit("-- 13c. Background Contacts to reach exactly 14,200 Total Contacts")
    for i in range(31, 14201):
        u = str(uuid.uuid4())
        ph = f"+234 80{((i * 7) % 9) + 1} {str(i).zfill(7)[:3]} {str(i).zfill(7)[3:]}"
        em = f"shipper_{i}@ftfclient.com"
        dt = (now - timedelta(days=random.randint(1, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        emit(f"INSERT OR REPLACE INTO contacts (id, uuid, workspace_id, phone_e164, email, first_name, last_name, country, language, opt_in_whatsapp, opt_in_sms, opt_in_email, created_at, updated_at) VALUES ({i}, '{u}', 10, '{ph}', '{em}', 'Shipper', '{i}', 'NG', 'en', 1, 1, 1, '{dt}', '{dt}');")
    emit("")

    # 14. Inbox Labels & Conversations
    emit("-- 14. Inbox Labels")
    inbox_label_defs = [
        (1, 'Waybill Tracking', '#0d9488'),
        (2, 'Express Freight', '#2563eb'),
        (3, 'Payment Pending', '#d97706'),
        (4, 'Customs Clearance', '#7c3aed'),
        (5, 'VIP Shipper', '#e11d48'),
    ]
    lbl_map = {}
    for lid, lname, lcolor in inbox_label_defs:
        lbl_map[lname] = lid
        emit(f"INSERT OR REPLACE INTO inbox_labels (id, workspace_id, name, color, created_at, updated_at) VALUES ({lid}, 10, {q(lname)}, '{lcolor}', '{created_client}', '{now_str}');")
    emit("")

    emit("-- 14b. 10 Active OPEN Conversations for Inbox Screenshots")
    primary_dialogs = [
        {
            "cid": 1, "status": "open", "unread": 0, "labels": ["Waybill Tracking", "Express Freight"], "min_ago": 8,
            "messages": [
                ("in", "Hello, what is the status of waybill #FTF-84920?"),
                ("out", "Your shipment arrived at Lagos Central Hub and is scheduled for dispatch today at 2:00 PM."),
            ]
        },
        {
            "cid": 2, "status": "open", "unread": 1, "labels": ["Express Freight", "Payment Pending"], "min_ago": 22,
            "messages": [
                ("in", "Hello, how much does it cost to send a 15kg commercial carton to London Heathrow?"),
                ("out", "Hi Babatunde! ✈️ For a 15kg commercial parcel to London, our express air freight rate is ₦18,500 per 5kg block (Total: ₦55,500 inclusive of customs waybill). Would you like me to generate your instant payment booking link?"),
                ("in", "Yes please send the payment link."),
                ("out", "Here is your direct 1-click in-chat booking and payment link: https://botifyai.cloud/buy/ftf-logistics/order-checkout/WB-10028405. Pay via Paystack or Flutterwave."),
            ]
        },
        {
            "cid": 3, "status": "open", "unread": 0, "labels": ["VIP Shipper", "Customs Clearance"], "min_ago": 45,
            "messages": [
                ("in", "Good day, please confirm pickup schedule for our international diplomatic cargo in Maitama."),
                ("out", "Good day Chioma! Our Abuja logistics team is scheduled for pickup at 2:00 PM today. A dedicated waybill supervisor has been assigned (Ref: #FTF-DIP-9901)."),
            ]
        },
        {
            "cid": 5, "status": "open", "unread": 1, "labels": ["Waybill Tracking"], "min_ago": 70,
            "messages": [
                ("out", "Hi Aisha! 👋 We noticed you started booking a freight shipment from Kano to Lagos but did not complete the checkout. Do you need any assistance with cargo dimensions or weight?"),
                ("in", "Hi, I was checking if there is any discount for multi-carton textile shipments."),
                ("out", "I have applied your 5% seasonal freight discount! You can complete your Kano to Lagos dispatch checkout here: https://botifyai.cloud/cart/recover/FTF-88219"),
            ]
        },
        {
            "cid": 8, "status": "open", "unread": 0, "labels": ["Waybill Tracking"], "min_ago": 95,
            "messages": [
                ("in", "Please confirm departure time for the Kaduna rail cargo."),
                ("out", "Waybill #FTF-KAD-5510 is cleared for transit on the Abuja-Kaduna secure rail express. Scheduled departure: 11:30 AM today."),
            ]
        },
        {
            "cid": 4, "status": "open", "unread": 0, "labels": ["Express Freight", "Customs Clearance"], "min_ago": 125,
            "messages": [
                ("in", "Has the customs documentation for container #FTF-CON-4402 been approved at Apapa Port?"),
                ("out", "Customs duty assessment for your UK air cargo import is ₦14,200. Paid automatically via Paystack escrow. Inspection clearance form WB-APAPA-092 is attached."),
            ]
        },
        {
            "cid": 11, "status": "open", "unread": 0, "labels": ["VIP Shipper"], "min_ago": 180,
            "messages": [
                ("in", "Could you send over the weekly dispatch manifest for our corporate account?"),
                ("out", "Your weekly consolidated freight dispatch summary (42 waybills) has been emailed to finance@daviesventures.ng. All tracking links are live."),
            ]
        },
        {
            "cid": 12, "status": "open", "unread": 1, "labels": ["Express Freight"], "min_ago": 240,
            "messages": [
                ("in", "Do you have temperature-controlled reefers for Port Harcourt transit?"),
                ("out", "Yes, we operate certified 20ft & 40ft refrigerated reefers maintained at 2°C–8°C with real-time IoT temperature logging. Port Harcourt cold-chain container delivery confirmed for Thursday 9:00 AM."),
            ]
        },
        {
            "cid": 13, "status": "open", "unread": 0, "labels": ["Waybill Tracking"], "min_ago": 310,
            "messages": [
                ("in", "Tracking WB #FTF-IB-3091 please."),
                ("out", "Waybill #FTF-IB-3091 successfully handed over to recipient at Ring Road, Ibadan. Signed POD by: S. Adeleke."),
            ]
        },
        {
            "cid": 7, "status": "open", "unread": 0, "labels": ["Express Freight"], "min_ago": 380,
            "messages": [
                ("in", "Flight departure confirmation for the London consignment please."),
                ("out", "London Stansted air cargo flight FTF-BA07 departed on time. Estimated MMIA arrival: tomorrow 05:15 AM."),
            ]
        },
    ]

    emit("DELETE FROM inbox_label_conversation;")
    msg_id_counter = 1
    for d_idx, d in enumerate(primary_dialogs, start=1):
        c_u = str(uuid.uuid4())
        last_dt = (now - timedelta(minutes=d["min_ago"])).strftime("%Y-%m-%d %H:%M:%S")
        num_msgs = len(d["messages"])
        first_dt = (datetime.strptime(last_dt, "%Y-%m-%d %H:%M:%S") - timedelta(minutes=(num_msgs - 1) * 3)).strftime("%Y-%m-%d %H:%M:%S")
        
        emit(f"INSERT OR REPLACE INTO conversations (id, uuid, workspace_id, channel_account_id, contact_id, status, assigned_to, unread_count, last_message_at, last_inbound_at, created_at, updated_at) VALUES ({d_idx}, '{c_u}', 10, 101, {d['cid']}, '{d['status']}', 'bot', {d['unread']}, '{last_dt}', '{last_dt}', '{first_dt}', '{last_dt}');")
        for lname in d["labels"]:
            lid = lbl_map[lname]
            emit(f"INSERT OR REPLACE INTO inbox_label_conversation (label_id, conversation_id) VALUES ({lid}, {d_idx});")
        for m_idx, (direction, body) in enumerate(d["messages"]):
            m_dt = (datetime.strptime(first_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=m_idx * 3)).strftime("%Y-%m-%d %H:%M:%S")
            emit(f"INSERT OR REPLACE INTO messages (id, conversation_id, direction, channel, type, body, status, sent_by, sent_at, created_at, updated_at) VALUES ({msg_id_counter}, {d_idx}, '{direction}', 'whatsapp', 'text', {q(body)}, 'delivered', '{'bot' if direction=='out' else 'human'}', '{m_dt}', '{m_dt}', '{m_dt}');")
            msg_id_counter += 1

    emit("-- 14c. Background Resolved Conversations (290 Conversations to reach 300 Total)")
    for cIdx in range(11, 301):
        c_u = str(uuid.uuid4())
        days_ago = random.randint(1, 28)
        c_dt = (now - timedelta(days=days_ago, minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        last_dt = (datetime.strptime(c_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(5, 45))).strftime("%Y-%m-%d %H:%M:%S")
        emit(f"INSERT OR REPLACE INTO conversations (id, uuid, workspace_id, channel_account_id, contact_id, status, assigned_to, unread_count, last_message_at, last_inbound_at, created_at, updated_at) VALUES ({cIdx}, '{c_u}', 10, 101, {cIdx}, 'resolved', 'bot', 0, '{last_dt}', '{c_dt}', '{c_dt}', '{last_dt}');")

    emit("-- 15. High-Throughput Messages (35,657 Messages - 18,500 Outbound / 17,157 Inbound)")
    sample_out = [
        'Hello! Your waybill tracking details have been verified.',
        'Here is your express freight quotation invoice.',
        'Your parcel has cleared airport customs and is out for delivery.',
        'Thanks for choosing FTF Digital Solutions Limited.',
        'Your in-chat checkout payment link is active: https://botifyai.cloud/buy/ftf-logistics',
    ]
    sample_in = [
        'Hi, please give me the status of my waybill.',
        'How much is 10kg shipping to London?',
        'Payment has been sent via Paystack.',
        'Thank you for the quick update!',
        'Please send the pickup agent contact number.',
    ]
    for mIdx in range(msg_id_counter, 35658):
        direction = 'out' if mIdx <= 18500 else 'in'
        # Route background messages ONLY to background conversations (11 to 300)
        conv_id = ((mIdx - msg_id_counter) % 290) + 11
        m_dt = (now - timedelta(days=random.randint(0, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        body = random.choice(sample_out) if direction == 'out' else random.choice(sample_in)
        emit(f"INSERT OR REPLACE INTO messages (id, conversation_id, direction, channel, type, body, status, sent_by, sent_at, created_at, updated_at) VALUES ({mIdx}, {conv_id}, '{direction}', 'whatsapp', 'text', {q(body)}, 'delivered', '{'bot' if direction=='out' else 'human'}', '{m_dt}', '{m_dt}', '{m_dt}');")
    emit("")

    # 16. Invoices & Orders (500 Orders, exactly ₦18,400,000 across 470 Paid Orders = 94%)
    emit("-- 16. Waybill Invoices & Orders (500 Orders, 470 Paid = 94%, ₦18,400,000 Gross Revenue)")
    screenshot_invs = [
        ('10028401', 'Ngozi Okonjo', 40000.00, 'paid', 2),
        ('10028402', 'Aisha Bello', 24500.00, 'pending', 5),
        ('10028403', 'Tunde Bakare', 32000.00, 'paid', 8),
        ('10028404', 'Chiamaka Nze', 12000.00, 'overdue', 12),
        ('10028405', 'Ibrahim Musa', 18500.00, 'paid', 18),
        ('10028406', 'Amaka Obi', 58000.00, 'pending', 24),
        ('10028407', 'Yusuf Garba', 27800.00, 'paid', 30),
        ('10028408', 'Bolaji Davies', 9000.00, 'overdue', 36),
        ('10028409', 'Chioma Eze', 65000.00, 'pending', 42),
        ('10028410', 'Fatima Dangote', 15000.00, 'paid', 48)
    ]
    screenshot_paid_sum = sum(x[2] for x in screenshot_invs if x[3] == 'paid')
    remaining_paid_count = 470 - sum(1 for x in screenshot_invs if x[3] == 'paid') # 465
    remaining_rev = 18400000.00 - screenshot_paid_sum
    avg_paid = round(remaining_rev / remaining_paid_count, 2)

    for idx, (inv_num, cust, amt, stat, hrs_ago) in enumerate(screenshot_invs, start=1):
        is_paid = (stat == 'paid')
        u = str(uuid.uuid4())
        placed = (now - timedelta(hours=hrs_ago)).strftime("%Y-%m-%d %H:%M:%S")
        paid_dt = placed if is_paid else "NULL"
        lines = json.dumps([{"name": "Waybill Booking & Freight Service", "sku": "FTF-LOGISTICS-SVC", "quantity": 1, "price": amt}])
        emit(f"INSERT OR REPLACE INTO ecommerce_orders (id, workspace_id, store_id, external_order_id, uuid, platform, number, customer_name, customer_email, customer_phone, status, financial_status, payment_status, fulfillment_status, currency, total, line_items, tracking_number, tracking_url, payment_gateway, payment_reference, placed_at, paid_at, created_at, updated_at)")
        emit(f"VALUES ({idx}, 10, 10, 'ftf_inv_{inv_num}', '{u}', 'native', '#{inv_num}', '{cust}', '{cust.lower().replace(' ', '.')}@ftfclient.com', '+23480234567{idx:02d}', '{'completed' if is_paid else 'open'}', '{stat}', '{stat}', '{'fulfilled' if is_paid else 'unfulfilled'}', 'NGN', {amt}, '{lines}', 'WB-{inv_num}', 'https://botifyai.cloud/buy/ftf-logistics/status/WB-{inv_num}', 'paystack', 'pstk_ref_{inv_num}', '{placed}', {q(paid_dt) if is_paid else 'NULL'}, '{placed}', '{placed}');")

    running_sum = screenshot_paid_sum
    for idx in range(11, 501):
        inv_num = f"1002{8400 + idx:04d}"
        is_paid = (idx <= 475)
        stat = 'paid' if is_paid else ('pending' if idx % 2 == 0 else 'overdue')
        if is_paid:
            if idx == 475:
                amt = round(18400000.00 - running_sum, 2)
            else:
                amt = round(avg_paid + random.randint(-12000, 15000), 2)
                running_sum += amt
        else:
            amt = random.choice([12000.00, 18500.00, 24500.00, 32000.00, 58000.00])
        u = str(uuid.uuid4())
        placed = (now - timedelta(days=random.randint(2, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        lines = json.dumps([{"name": "Waybill Booking & Freight Transit", "sku": "FTF-LOGISTICS-SVC", "quantity": 1, "price": amt}])
        emit(f"INSERT OR REPLACE INTO ecommerce_orders (id, workspace_id, store_id, external_order_id, uuid, platform, number, customer_name, customer_email, customer_phone, status, financial_status, payment_status, fulfillment_status, currency, total, line_items, tracking_number, tracking_url, payment_gateway, payment_reference, placed_at, paid_at, created_at, updated_at)")
        emit(f"VALUES ({idx}, 10, 10, 'ftf_inv_{inv_num}', '{u}', 'native', '#{inv_num}', 'Enterprise Client {idx}', 'client_{idx}@ftfclient.com', '+23480{idx:08d}', '{'completed' if is_paid else 'open'}', '{stat}', '{stat}', '{'fulfilled' if is_paid else 'unfulfilled'}', 'NGN', {amt}, '{lines}', 'WB-{inv_num}', 'https://botifyai.cloud/buy/ftf-logistics/status/WB-{inv_num}', 'paystack', 'pstk_ref_{inv_num}', '{placed}', {q(placed) if is_paid else 'NULL'}, '{placed}', '{placed}');")
    emit("")

    # 17. Cart Recovery (100 Carts, 35 Recovered = 35% Recovery Rate)
    emit("-- 17. Automated Cart Recovery (100 Carts, 35 Recovered = 35%)")
    for i in range(1, 101):
        is_rec = (i <= 35)
        ab_dt = (now - timedelta(days=random.randint(1, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        rec_dt = (datetime.strptime(ab_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(12, 120))).strftime("%Y-%m-%d %H:%M:%S") if is_rec else None
        tot = random.choice([24500.00, 32000.00, 40000.00, 58000.00, 75000.00])
        lines = json.dumps([{"name": "Waybill Booking & Freight Service", "quantity": 1, "price": 40000.00}])
        emit(f"INSERT OR REPLACE INTO ecommerce_carts (id, workspace_id, store_id, contact_id, external_id, total, currency, line_items, recovery_url, abandoned_at, recovery_triggered_at, recovered_at, created_at, updated_at)")
        emit(f"VALUES ({i}, 10, 10, {i}, 'ftf_cart_{i:05d}', {tot}, 'NGN', '{lines}', 'https://botifyai.cloud/buy/ftf-logistics/checkout/recover?cart=ftf_cart_{i}', '{ab_dt}', '{ab_dt}', {q(rec_dt)}, '{ab_dt}', '{rec_dt or ab_dt}');")
    emit("")

    # 18. Campaign & Usage Meters
    emit("-- 18. Meta WhatsApp Broadcast Campaign (35,657 dispatches, 99.2% delivery, 84% read)")
    totals = json.dumps({
        "total": 35657, "queued": 0, "sent": 35657, "delivered": 35336,
        "read": 29952, "failed": 321, "clicked": 12480, "unsubscribed": 45
    })
    payload = json.dumps({"body": "Hello {{contact.first_name}}, your shipping waybill is ready for dispatch."})
    template = json.dumps({"name": "waybill_dispatch_recovery", "language": "en"})
    camp_u = str(uuid.uuid4())
    emit(f"INSERT OR REPLACE INTO campaigns (id, uuid, workspace_id, name, campaign_type, channel, whatsapp_phone_number_id, audience_type, audience_ref, template_ref, payload_json, schedule_at, timezone, status, totals_json, created_by, created_at, updated_at)")
    emit(f"VALUES (10, '{camp_u}', 10, 'In-Chat Waybill Dispatch & Checkout Recovery', 'broadcast', 'whatsapp', '104928572910482', 'segment', 'Incomplete Checkouts & Active Shippers', '{template}', '{payload}', '{(now - timedelta(days=10)).strftime('%Y-%m-%d %H:%M:%S')}', 'Africa/Lagos', 'completed', '{totals}', 10, '{created_client}', '{now_str}');")
    
    emit("-- 18b. Campaign Delivery Telemetry (500 Recipients)")
    for r in range(1, 501):
        is_fail = (r <= 4)
        is_read = (not is_fail and r <= 424)
        is_deliv = (not is_fail)
        st = 'failed' if is_fail else ('read' if is_read else 'delivered')
        s_dt = (now - timedelta(days=10, minutes=random.randint(1, 55))).strftime("%Y-%m-%d %H:%M:%S")
        deliv_dt = (datetime.strptime(s_dt, "%Y-%m-%d %H:%M:%S") + timedelta(seconds=random.randint(1, 5))).strftime("%Y-%m-%d %H:%M:%S") if is_deliv else None
        read_dt = (datetime.strptime(deliv_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(2, 45))).strftime("%Y-%m-%d %H:%M:%S") if is_read else None
        click_dt = (datetime.strptime(read_dt, "%Y-%m-%d %H:%M:%S") + timedelta(minutes=random.randint(1, 10))).strftime("%Y-%m-%d %H:%M:%S") if (is_read and r <= 175) else None
        f_reason = "Meta API temporary provider rejection (321 denied)" if is_fail else None
        emit(f"INSERT OR REPLACE INTO campaign_recipients (id, campaign_id, contact_id, status, provider_message_id, sent_at, delivered_at, read_at, clicked_at, failed_reason, created_at, updated_at) VALUES ({r}, 10, {r}, '{st}', 'wamid.HBgL{uuid.uuid4().hex[:20]}', '{s_dt}', {q(deliv_dt)}, {q(read_dt)}, {q(click_dt)}, {q(f_reason)}, '{s_dt}', '{click_dt or read_dt or deliv_dt or s_dt}');")
    
    emit("-- 19. Monthly Usage Meters")
    period = int(now.strftime("%Y%m"))
    meters = [
        ('whatsapp_messages', 35657), ('sms_sent', 4500), ('emails_sent', 12800),
        ('ai_tokens', 2450000), ('campaigns_sent', 24), ('lead_credits', 14200)
    ]
    for idx, (m, v) in enumerate(meters, start=101):
        emit(f"INSERT OR REPLACE INTO usage_meters (id, workspace_id, metric, period, value, created_at, updated_at) VALUES ({idx}, 10, '{m}', {period}, {v}, '{now_str}', '{now_str}');")
    emit("")

    # 20. AI Knowledge Base & Copilot Runs (500 runs, 98.4% success, sub-second latency)
    emit("-- 20. AI Knowledge Base & Chatbot Copilot Telemetry (500 Runs, 98.4% resolution, sub-second latency)")
    emit(f"INSERT OR REPLACE INTO ai_provider_configs (id, workspace_id, provider, credentials, default_model_chat, default_model_embed, enabled, created_at, updated_at) VALUES (10, 10, 'openai', '{{\"api_key\":\"sk-ftf-production-live-gateway\"}}', 'gpt-4o-mini', 'text-embedding-3-small', 1, '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_knowledge_bases (id, workspace_id, name, embedding_model, dimensions, status, created_at, updated_at) VALUES (10, 10, 'FTF Cross-Border Logistics & Quotation KB', 'text-embedding-3-small', 1536, 'active', '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_kb_documents (id, kb_id, title, source_type, source_ref, status, tokens, last_indexed_at, created_at, updated_at) VALUES (10, 10, 'FTF Shipping Tariffs & Waybill Routing', 'text', 'doc:ftf-logistics-core', 'indexed', 1450, '{(now - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S')}', '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_kb_chunks (id, kb_id, document_id, ord, content, tokens, created_at, updated_at) VALUES (10, 10, 10, 0, 'FTF Digital Solutions Limited is a leading cross-border logistics company handling local, interstate, and international shipping across Nigeria, the UK, and North America. Express transit is 3-5 days for UK and 5-7 days for North America.', 250, '{created_client}', '{now_str}');")
    emit(f"INSERT OR REPLACE INTO ai_chatbots (id, workspace_id, ai_kb_id, name, system_prompt, tone, max_context_chunks, fallback_reply, channels, enabled, is_default, created_at, updated_at) VALUES (10, 10, 10, 'FTF Logistics AI Quotation & Tracking Copilot', 'You are the official AI Sales Copilot for FTF Digital Solutions Limited.', 'professional', 5, 'Our senior coordinator is reviewing your custom freight booking.', '[\"whatsapp\",\"instagram\",\"messenger\",\"web\"]', 1, 1, '{created_client}', '{now_str}');")

    for r_idx in range(1, 501):
        prompt = random.randint(240, 780)
        comp = random.randint(60, 290)
        is_err = (r_idx % 62 == 0 and r_idx > 0) # 8 errors in 500 = 98.4% ok
        st = 'error' if is_err else 'ok'
        cost = int(((prompt * 0.000015 + comp * 0.00006) * 100) + 1)
        lat = random.randint(380, 720) # sub-second latency
        r_dt = (now - timedelta(days=random.randint(0, 28), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
        emit(f"INSERT OR REPLACE INTO ai_runs (id, chatbot_id, prompt_tokens, completion_tokens, cost_cents, latency_ms, model, status, created_at, updated_at) VALUES ({r_idx}, 10, {prompt}, {comp}, {cost}, {lat}, 'gpt-4o-mini', '{st}', '{r_dt}', '{r_dt}');")

    # 21. Automations (6 Named Flows with nodes, edges, and runs)
    emit("-- 21. Active Workflows (6 Named Flows with Full Node-Edge Topologies)")
    flows = [
        {
            "id": 101, "name": "Waybill & Tracking Lookup Flow", "trigger": "message.received", "run_count": 384,
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Incoming WhatsApp Message"}},
                {"id": "condition-1", "type": "condition", "position": {"x": 250, "y": 150}, "data": {"label": "Contains Waybill Regex (#FTF- / WB-)"}},
                {"id": "action-1", "type": "action", "position": {"x": 250, "y": 250}, "data": {"label": "Query Waybill Tracking API"}},
                {"id": "action-2", "type": "action", "position": {"x": 250, "y": 350}, "data": {"label": "Send WhatsApp Live GPS Dispatch Status"}}
            ],
            "edges": [
                {"id": "e1-2", "source": "trigger-1", "target": "condition-1"},
                {"id": "e2-3", "source": "condition-1", "target": "action-1"},
                {"id": "e3-4", "source": "action-1", "target": "action-2"}
            ]
        },
        {
            "id": 102, "name": "Instant Shipping Rate Calculator", "trigger": "message.received", "run_count": 291,
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Keyword quote or rate"}},
                {"id": "action-1", "type": "action", "position": {"x": 250, "y": 150}, "data": {"label": "Extract Weight (kg) & Destination City"}},
                {"id": "action-2", "type": "action", "position": {"x": 250, "y": 250}, "data": {"label": "Compute Dynamic Tariff (UK Express / Interstate)"}},
                {"id": "action-3", "type": "action", "position": {"x": 250, "y": 350}, "data": {"label": "Send WhatsApp Quote + 1-Click Paystack Link"}}
            ],
            "edges": [
                {"id": "e1-2", "source": "trigger-1", "target": "action-1"},
                {"id": "e2-3", "source": "action-1", "target": "action-2"},
                {"id": "e3-4", "source": "action-2", "target": "action-3"}
            ]
        },
        {
            "id": 103, "name": "In-Chat Waybill Invoicing (Paystack API)", "trigger": "order.placed", "run_count": 470,
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Waybill Booking Order Created"}},
                {"id": "action-1", "type": "action", "position": {"x": 250, "y": 150}, "data": {"label": "Generate Paystack Payment Reference & QR"}},
                {"id": "action-2", "type": "action", "position": {"x": 250, "y": 250}, "data": {"label": "Send Interactive Invoice WhatsApp Message"}},
                {"id": "action-3", "type": "action", "position": {"x": 250, "y": 350}, "data": {"label": "Auto-Reconcile Merchant Ledger Balance"}}
            ],
            "edges": [
                {"id": "e1-2", "source": "trigger-1", "target": "action-1"},
                {"id": "e2-3", "source": "action-1", "target": "action-2"},
                {"id": "e3-4", "source": "action-2", "target": "action-3"}
            ]
        },
        {
            "id": 104, "name": "Abandoned Checkout Recovery (WhatsApp)", "trigger": "cart.abandoned", "run_count": 100,
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Cart Inactive for 30 Minutes"}},
                {"id": "delay-1", "type": "delay", "position": {"x": 250, "y": 150}, "data": {"label": "Wait 15 Minutes"}},
                {"id": "action-1", "type": "action", "position": {"x": 250, "y": 250}, "data": {"label": "Send Meta Template: waybill_dispatch_recovery"}},
                {"id": "action-2", "type": "action", "position": {"x": 250, "y": 350}, "data": {"label": "Apply 5% Freight Voucher on WhatsApp Click"}}
            ],
            "edges": [
                {"id": "e1-2", "source": "trigger-1", "target": "delay-1"},
                {"id": "e2-3", "source": "delay-1", "target": "action-1"},
                {"id": "e3-4", "source": "action-1", "target": "action-2"}
            ]
        },
        {
            "id": 105, "name": "Omnichannel Cross-Border Dispatch (Meta Cloud API)", "trigger": "webhook.received", "run_count": 158,
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Customs Cargo Cleared Webhook"}},
                {"id": "action-1", "type": "action", "position": {"x": 250, "y": 150}, "data": {"label": "Assign Local Dispatch Hub & Rider"}},
                {"id": "action-2", "type": "action", "position": {"x": 250, "y": 250}, "data": {"label": "Broadcast SMS & WhatsApp Dispatch Notice"}}
            ],
            "edges": [
                {"id": "e1-2", "source": "trigger-1", "target": "action-1"},
                {"id": "e2-3", "source": "action-1", "target": "action-2"}
            ]
        },
        {
            "id": 106, "name": "VIP Freight Customs Clearance Alert", "trigger": "contact.tag_added", "run_count": 64,
            "nodes": [
                {"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 50}, "data": {"label": "Tag Customs Clearance Added"}},
                {"id": "action-1", "type": "action", "position": {"x": 250, "y": 150}, "data": {"label": "Generate Formal Bill of Lading Assessment"}},
                {"id": "action-2", "type": "action", "position": {"x": 250, "y": 250}, "data": {"label": "Notify Dedicated Logistics Account Manager"}}
            ],
            "edges": [
                {"id": "e1-2", "source": "trigger-1", "target": "action-1"},
                {"id": "e2-3", "source": "action-1", "target": "action-2"}
            ]
        }
    ]

    emit("DELETE FROM automation_runs;")
    run_counter = 1
    for flow in flows:
        f_u = str(uuid.uuid4())
        nodes_json = json.dumps(flow["nodes"]).replace("'", "''")
        edges_json = json.dumps(flow["edges"]).replace("'", "''")
        def_json = json.dumps({"nodes": flow["nodes"], "edges": flow["edges"]}).replace("'", "''")
        emit(f"INSERT OR REPLACE INTO automations (id, uuid, workspace_id, name, trigger_type, status, nodes, edges, definition_json, run_count, created_by, created_at, updated_at)")
        emit(f"VALUES ({flow['id']}, '{f_u}', 10, {q(flow['name'])}, '{flow['trigger']}', 'active', '{nodes_json}', '{edges_json}', '{def_json}', {flow['run_count']}, 10, '{created_client}', '{now_str}');")
        
        for r_idx in range(1, flow["run_count"] + 1):
            s_dt = (now - timedelta(days=random.randint(0, 20), minutes=random.randint(0, 1400))).strftime("%Y-%m-%d %H:%M:%S")
            emit(f"INSERT OR REPLACE INTO automation_runs (id, automation_id, workspace_id, status, started_at, completed_at, created_at, updated_at) VALUES ({run_counter}, {flow['id']}, 10, 'completed', '{s_dt}', '{s_dt}', '{s_dt}', '{s_dt}');")
            run_counter += 1
    emit("")

    # Write SQL script
    sql_path = "database/data/ftf_digital_solutions_seed.sql"
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"Generated {len(sql_lines)} SQL statements in {sql_path}")

    # Populate SQLite database
    db_path = "database/database.sqlite"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA synchronous = OFF")
    cur.execute("PRAGMA journal_mode = MEMORY")
    
    # Ensure tables exist in SQLite
    cur.execute("DROP TABLE IF EXISTS merchant_bank_accounts")
    cur.execute("CREATE TABLE IF NOT EXISTS merchant_bank_accounts (id INTEGER PRIMARY KEY, workspace_id INTEGER, bank_name TEXT, bank_code TEXT, account_number TEXT, account_name TEXT, recipient_code TEXT, currency TEXT DEFAULT 'NGN', is_default INTEGER DEFAULT 1, created_at DATETIME, updated_at DATETIME)")
    cur.execute("CREATE TABLE IF NOT EXISTS merchant_wallets (id INTEGER PRIMARY KEY, workspace_id INTEGER, currency TEXT DEFAULT 'NGN', available_balance_cents INTEGER DEFAULT 0, pending_balance_cents INTEGER DEFAULT 0, total_withdrawn_cents INTEGER DEFAULT 0, total_earned_cents INTEGER DEFAULT 0, is_frozen INTEGER DEFAULT 0, created_at DATETIME, updated_at DATETIME)")
    cur.execute("CREATE TABLE IF NOT EXISTS merchant_ledger_entries (id INTEGER PRIMARY KEY, workspace_id INTEGER, wallet_id INTEGER, entry_type TEXT, amount_cents INTEGER, fee_cents INTEGER, net_amount_cents INTEGER, running_balance_cents INTEGER, currency TEXT, reference_type TEXT, reference_id INTEGER, description TEXT, created_at DATETIME, updated_at DATETIME)")
    
    cur.execute('''
    CREATE TABLE IF NOT EXISTS contact_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        name VARCHAR(64) NOT NULL,
        color VARCHAR(16) DEFAULT '#6366f1',
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(workspace_id, name)
    )''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS contact_tag_pivot (
        contact_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (contact_id, tag_id)
    )''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS inbox_labels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        name VARCHAR(64) NOT NULL,
        color VARCHAR(16) DEFAULT '#6366f1',
        created_at DATETIME,
        updated_at DATETIME,
        UNIQUE(workspace_id, name)
    )''')

    cur.execute('''
    CREATE TABLE IF NOT EXISTS inbox_label_conversation (
        label_id INTEGER NOT NULL,
        conversation_id INTEGER NOT NULL,
        PRIMARY KEY (label_id, conversation_id)
    )''')

    for col, ctype in [('uuid', 'TEXT'), ('nodes', 'JSON'), ('edges', 'JSON'), ('run_count', 'INTEGER DEFAULT 0'), ('trigger_config', 'JSON'), ('trigger_token', 'TEXT')]:
        try:
            cur.execute(f'ALTER TABLE automations ADD COLUMN {col} {ctype}')
        except Exception:
            pass

    for col, ctype in [('contact_id', 'INTEGER'), ('context', 'JSON'), ('current_node_id', 'TEXT'), ('resume_node_id', 'TEXT'), ('error', 'TEXT')]:
        try:
            cur.execute(f'ALTER TABLE automation_runs ADD COLUMN {col} {ctype}')
        except Exception:
            pass

    try:
        cur.execute("ALTER TABLE ecommerce_stores ADD COLUMN bank_account_id INTEGER")
    except Exception:
        pass
    try:
        cur.execute("ALTER TABLE campaigns ADD COLUMN campaign_type VARCHAR(64) DEFAULT 'newsletter'")
    except Exception:
        pass

    # Execute all lines
    full_sql = "\n".join(sql_lines)
    cur.executescript(full_sql)
    conn.commit()
    conn.close()
    print("Populated database/database.sqlite successfully.")

if __name__ == '__main__':
    main()
