import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { VendorsModule } from './vendors/vendors.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { TaxRatesModule } from './tax-rates/tax-rates.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { CustomerAddressesModule } from './customer-addresses/customer-addresses.module';
import { DeliveryZonesModule } from './delivery-zones/delivery-zones.module';
import { DeliverySlotsModule } from './delivery-slots/delivery-slots.module';
import { OrdersModule } from './orders/orders.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { InvoicesModule } from './invoices/invoices.module';
import { InvoiceItemsModule } from './invoice-items/invoice-items.module';
import { CustomerPaymentsModule } from './customer-payments/customer-payments.module';
import { PaymentAllocationsModule } from './payment-allocations/payment-allocations.module';
import { AccountsModule } from './accounts/accounts.module';
import { JournalEntriesModule } from './journal-entries/journal-entries.module';
import { PostingEngineModule } from './posting-engine/posting-engine.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SupplierBillsModule } from './supplier-bills/supplier-bills.module';
import { VendorPaymentsModule } from './vendor-payments/vendor-payments.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RazorpayModule } from './razorpay/razorpay.module';
import { SocietiesModule } from './societies/societies.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { GstModule } from './gst/gst.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuditLogsModule,
    AuthModule,
    CustomersModule,
    VendorsModule,
    ProductsModule,
    CategoriesModule,
    TaxRatesModule,
    ExpenseCategoriesModule,
    CustomerAddressesModule,
    DeliveryZonesModule,
    DeliverySlotsModule,
    OrdersModule,
    OrderItemsModule,
    InvoicesModule,
    InvoiceItemsModule,
    CustomerPaymentsModule,
    PaymentAllocationsModule,
    AccountsModule,
    GstModule,
    JournalEntriesModule,
    PostingEngineModule,
    ExpensesModule,
    SupplierBillsModule,
    VendorPaymentsModule,
    ReportsModule,
    DashboardModule,
    RazorpayModule,
    SocietiesModule,
    WhatsappModule,
  ],
})
export class AppModule {}
