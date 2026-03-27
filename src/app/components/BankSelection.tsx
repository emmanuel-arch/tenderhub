import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Clock, DollarSign, CheckCircle, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { tenders, banks } from '../data/mockData';
import { ImageWithFallback } from './ImageWithFallback';

export function BankSelection() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const tender = tenders.find(t => t.id === id);

  if (!tender) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Tender Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Back to Tenders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate(`/tender/${id}`)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tender Details
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tender Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select a Bank for Your Bid Bond</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Tender</div>
                <div className="font-medium line-clamp-2">{tender.title}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Procuring Entity</div>
                <div className="font-medium">{tender.procuringEntity}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">Bond Amount Required</div>
                <div className="text-xl font-bold text-slate-900">
                  {formatCurrency(tender.bidBondAmount)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banks Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Available Banks</h2>
          <p className="text-slate-600">Compare and select the best option for your bid bond application</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map(bank => (
            <Card key={bank.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <ImageWithFallback
                      src={bank.logo}
                      alt={`${bank.name} logo`}
                      className="w-full h-full object-cover"
                      width={64}
                      height={64}
                    />
                  </div>
                  {bank.digitalOption && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Digital
                    </Badge>
                  )}
                </div>
                <CardTitle>{bank.name}</CardTitle>
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(bank.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-slate-600 ml-1">({bank.rating})</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Processing Time</span>
                  </div>
                  <div className="font-medium">{bank.processingTime}</div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Processing Fees</span>
                  </div>
                  <div className="font-medium text-sm">{bank.fees}</div>
                </div>

                <Button 
                  className="w-full mt-4"
                  onClick={() => navigate(`/tender/${id}/bid-bond/${bank.id}`)}
                >
                  Select {bank.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Need Help Choosing?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-4">
              Consider these factors when selecting a bank:
            </p>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Processing Time:</strong> Choose a faster option if your deadline is near</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Fees:</strong> Compare total costs including percentage fees</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Digital Option:</strong> Apply online without visiting a branch</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span><strong>Rating:</strong> Check customer satisfaction ratings</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
